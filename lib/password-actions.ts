
'use server';

import { sql } from '@vercel/postgres';
import crypto from 'crypto';
import { Resend } from 'resend';

// NOTE: You must add RESEND_API_KEY to your .env
// We can use a dummy sender for development or console log if key not present.
const resend = new Resend(process.env.RESEND_API_KEY || 're_123');

export async function forgotPassword(formData: FormData) {
    const email = formData.get('email') as string;

    // 1. Check if user exists
    const user = await sql`SELECT * FROM users WHERE email=${email}`;
    if (user.rows.length === 0) {
        // We return success anyway to avoid enumerating emails
        return { message: 'Si el correo existe, recibirás un enlace de recuperación.' };
    }

    // 2. Generate token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 1 * 3600 * 1000); // 1 hour

    // 3. Store token
    // First clean up old tokens
    await sql`DELETE FROM password_resets WHERE email=${email}`;
    await sql`INSERT INTO password_resets (email, token, expires_at) VALUES (${email}, ${token}, ${expiresAt.toISOString()})`;

    // 4. Send Email
    // In dev mode, we log the link. In prod, use Resend/Nodemailer.
    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${token}`;

    console.log(`[DEV] Reset Link for ${email}: ${resetLink}`);

    try {
        if (process.env.RESEND_API_KEY) {
            await resend.emails.send({
                from: 'Xeoris Security <security@xeoris.com>',
                to: email,
                subject: 'Restablecer Contraseña',
                html: `<p>Hola,</p><p>Has solicitado restablecer tu contraseña. Haz clic en el siguiente enlace:</p><p><a href="${resetLink}">Restablecer Contraseña</a></p><p>Este enlace caduca en 1 hora.</p>`
            });
        }
    } catch (error) {
        console.error('Error sending email:', error);
    }

    return { message: 'Si el correo existe, recibirás un enlace de recuperación.' };
}

import bcrypt from 'bcryptjs';

export async function resetPassword(formData: FormData) {
    const token = formData.get('token') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (password !== confirmPassword) {
        return { error: 'Las contraseñas no coinciden.' };
    }

    // 1. Verify token
    const record = await sql`SELECT * FROM password_resets WHERE token=${token} AND expires_at > NOW()`;
    if (record.rows.length === 0) {
        return { error: 'Token inválido o expirado.' };
    }

    const email = record.rows[0].email;

    // 2. Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Update user
    await sql`UPDATE users SET password=${hashedPassword} WHERE email=${email}`;

    // 4. Delete token
    await sql`DELETE FROM password_resets WHERE email=${email}`;

    return { success: true };
}
