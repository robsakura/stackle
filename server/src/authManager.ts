import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const JWT_SECRET = process.env.JWT_SECRET!;

export interface JwtPayload {
  userId: string;
  username: string;
  nickname: string;
}

export async function registerUser(
  username: string,
  nickname: string,
  password: string
): Promise<{ id: string; username: string; nickname: string }> {
  const passwordHash = await bcrypt.hash(password, 10);
  const { data, error } = await supabase
    .from('users')
    .insert({ username, nickname, password_hash: passwordHash })
    .select('id, username, nickname')
    .single();

  if (error) {
    if (error.code === '23505') {
      if (error.message.includes('username')) throw new Error('Username already taken');
      if (error.message.includes('nickname')) throw new Error('Nickname already taken');
      throw new Error('Username or nickname already taken');
    }
    throw new Error(error.message);
  }

  return data;
}

export async function loginUser(username: string, password: string): Promise<string> {
  const { data, error } = await supabase
    .from('users')
    .select('id, username, nickname, password_hash')
    .eq('username', username)
    .single();

  if (error || !data) throw new Error('Invalid username or password');

  const valid = await bcrypt.compare(password, data.password_hash);
  if (!valid) throw new Error('Invalid username or password');

  const payload: JwtPayload = {
    userId: data.id,
    username: data.username,
    nickname: data.nickname,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}
