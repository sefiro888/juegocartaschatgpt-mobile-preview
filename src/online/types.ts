import type { GameState } from '../types/card';

export type OnlineMatchStatus = 'waiting' | 'active' | 'finished';
export type OnlineRole = 'host' | 'guest';

export interface OnlineMatchRecord {
  id: string;
  room_code: string;
  host_id: string;
  guest_id: string | null;
  status: OnlineMatchStatus;
  game_state: GameState;
  revision: number;
  created_at: string;
  updated_at: string;
}

export interface OnlineSession {
  matchId: string;
  roomCode: string;
  role: OnlineRole;
  localController: 'PLAYER' | 'OPPONENT';
  revision: number;
  status: OnlineMatchStatus;
}
