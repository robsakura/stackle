import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface LeaderboardEntry {
  id: string;
  nickname: string;
  wins: number;
  losses: number;
  drops: number;
  total: number;
  win_pct: number;
}

export interface UserStats {
  nickname: string;
  wins: number;
  losses: number;
  drops: number;
  win_pct: number;
}

async function incrementField(userId: string, field: 'wins' | 'losses' | 'drops'): Promise<void> {
  const { data } = await supabase.from('users').select(field).eq('id', userId).single();
  if (data) {
    const row = data as Record<string, number>;
    await supabase.from('users').update({ [field]: row[field] + 1 }).eq('id', userId);
  }
}

export async function recordResult(winnerId: string, loserId: string): Promise<void> {
  await Promise.all([
    incrementField(winnerId, 'wins'),
    incrementField(loserId, 'losses'),
  ]);
}

export async function recordDrop(dropperId: string, opponentId: string): Promise<void> {
  await Promise.all([
    incrementField(dropperId, 'drops'),
    incrementField(dropperId, 'losses'),
    incrementField(opponentId, 'wins'),
  ]);
}

export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase
    .from('users')
    .select('id, nickname, wins, losses, drops');

  if (error || !data) return [];

  return data
    .map(u => ({
      id: u.id,
      nickname: u.nickname,
      wins: u.wins as number,
      losses: u.losses as number,
      drops: u.drops as number,
      total: (u.wins as number) + (u.losses as number) + (u.drops as number),
      win_pct: 0,
    }))
    .filter(u => u.total >= 5)
    .map(u => ({ ...u, win_pct: u.wins / u.total }))
    .sort((a, b) => b.win_pct - a.win_pct)
    .slice(0, 20);
}

export async function getUserStats(userId: string): Promise<UserStats | null> {
  const { data, error } = await supabase
    .from('users')
    .select('nickname, wins, losses, drops')
    .eq('id', userId)
    .single();

  if (error || !data) return null;

  const total = (data.wins as number) + (data.losses as number) + (data.drops as number);
  return {
    nickname: data.nickname as string,
    wins: data.wins as number,
    losses: data.losses as number,
    drops: data.drops as number,
    win_pct: total > 0 ? (data.wins as number) / total : 0,
  };
}
