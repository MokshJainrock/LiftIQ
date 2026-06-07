import "server-only";
import { sql } from "./client";

export interface NeonUser {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  supabaseId: string | null;
  createdAt: number;
}

type Row = Record<string, unknown>;

function mapUser(d: Row): NeonUser {
  return {
    id: d.id as string,
    email: d.email as string,
    passwordHash: d.password_hash as string,
    fullName: (d.full_name as string) ?? "",
    supabaseId: (d.supabase_id as string) ?? null,
    createdAt: new Date(d.created_at as string).getTime(),
  };
}

export async function getUserByEmail(email: string): Promise<NeonUser | null> {
  const rows = (await sql.query(`select * from users where lower(email) = lower($1)`, [email])) as Row[];
  return rows[0] ? mapUser(rows[0]) : null;
}

export async function getUserById(id: string): Promise<NeonUser | null> {
  const rows = (await sql.query(`select * from users where id = $1`, [id])) as Row[];
  return rows[0] ? mapUser(rows[0]) : null;
}

export async function createUser(params: {
  email: string;
  passwordHash: string;
  fullName?: string;
  supabaseId?: string | null;
}): Promise<NeonUser> {
  const rows = (await sql.query(
    `insert into users (email, password_hash, full_name, supabase_id)
     values ($1,$2,$3,$4)
     returning *`,
    [params.email, params.passwordHash, params.fullName ?? "", params.supabaseId ?? null]
  )) as Row[];
  return mapUser(rows[0]);
}

export async function updateUserPassword(id: string, passwordHash: string): Promise<void> {
  await sql.query(`update users set password_hash = $2, updated_at = now() where id = $1`, [
    id,
    passwordHash,
  ]);
}

export async function linkSupabaseId(id: string, supabaseId: string): Promise<void> {
  await sql.query(`update users set supabase_id = $2, updated_at = now() where id = $1`, [
    id,
    supabaseId,
  ]);
}
