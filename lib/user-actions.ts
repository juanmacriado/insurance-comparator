
'use server';

import { sql } from '@vercel/postgres';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';

export async function getUsers() {
    // Protect this action
    const session = await auth();
    if (session?.user?.role !== 'admin') {
        throw new Error('Unauthorized');
    }

    try {
        const result = await sql`SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC`;
        return result.rows;
    } catch (error) {
        console.error('Error fetching users:', error);
        throw new Error('Failed to fetch users.');
    }
}

export async function createUser(formData: FormData) {
    const session = await auth();
    if (session?.user?.role !== 'admin') {
        return { error: 'No tienes permisos para realizar esta acción.' };
    }

    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const role = formData.get('role') as string || 'user';

    if (!email || !password) {
        return { error: 'Email y contraseña son obligatorios.' };
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        await sql`
            INSERT INTO users (name, email, password, role)
            VALUES (${name}, ${email}, ${hashedPassword}, ${role})
        `;

        revalidatePath('/admin/users');
        return { success: true };
    } catch (error: any) {
        if (error.code === '23505') { // Postgres unique violation code
            return { error: 'El correo electrónico ya está registrado.' };
        }
        console.error('Error creating user:', error);
        return { error: 'Error al crear el usuario.' };
    }
}

export async function deleteUser(id: number) {
    const session = await auth();
    if (session?.user?.role !== 'admin') {
        return { error: 'Unauthorized' };
    }

    try {
        await sql`DELETE FROM users WHERE id=${id}`;
        revalidatePath('/admin/users');
        return { success: true };
    } catch (error) {
        console.error('Error deleting user:', error);
        return { error: 'Failed to delete user' };
    }
}
