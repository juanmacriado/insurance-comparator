
import 'dotenv/config';
import { sql } from '@vercel/postgres';
import bcrypt from 'bcryptjs';

async function seedAdmin() {
    const email = 'admin@admin.com';
    const password = 'admin'; // Temporary password
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        await sql`
            INSERT INTO users (name, email, password, role)
            VALUES ('Admin', ${email}, ${hashedPassword}, 'admin')
            ON CONFLICT (email) DO NOTHING
        `;
        console.log(`Admin user seeded. Email: ${email}, Password: ${password}`);
    } catch (e) {
        console.error('Error seeding admin:', e);
    }
}

seedAdmin();
