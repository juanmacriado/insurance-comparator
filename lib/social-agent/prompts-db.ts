'use server';

import { sql } from '@vercel/postgres';

export interface SavedPrompt {
    id: number;
    name: string;
    content: string;
    created_at: Date;
}

export async function ensurePromptsTable() {
    await sql`
        CREATE TABLE IF NOT EXISTS social_agent_prompts (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT NOW()
        );
    `;
}

export async function getPrompts(): Promise<SavedPrompt[]> {
    await ensurePromptsTable();
    const { rows } = await sql`SELECT * FROM social_agent_prompts ORDER BY created_at DESC`;
    return rows.map(r => ({
        id: r.id,
        name: r.name,
        content: r.content,
        created_at: r.created_at
    }));
}

export async function savePrompt(name: string, content: string) {
    await ensurePromptsTable();
    await sql`INSERT INTO social_agent_prompts (name, content) VALUES (${name}, ${content})`;
}

export async function deletePrompt(id: number) {
    await sql`DELETE FROM social_agent_prompts WHERE id = ${id}`;
}
