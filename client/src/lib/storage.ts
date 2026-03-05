import type { GameState } from './types';

export function saveState(key: string, state: GameState): void {
  try {
    localStorage.setItem(key, JSON.stringify(state));
  } catch {
    // ignore storage errors
  }
}

export function loadState(key: string): GameState | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as GameState;
  } catch {
    return null;
  }
}

export function clearState(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}
