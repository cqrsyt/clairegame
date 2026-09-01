export type PlayerId = string;

export interface AICoach {
  suggestMove(state: unknown): unknown | null;
  explain(state: unknown): string;
  legalHighlights(state: unknown): unknown[];
}

export interface GameMeta {
  id: string;
  nameZh: string;
  nameEn: string;
  genre: string;
  playable: 'full-ai' | 'full-bots' | 'online' | 'encyclopedia';
  players: string;
  summary: string;
  encyclopedia: string;
  tutorial: string[];
}

export type RoomStatus = 'lobby' | 'playing' | 'ended';
