// ─── Core types ───

export interface Team {
  id: number;
  name: string;
  short: string;
  crest: string;
  coach?: string;
  formation?: string;
  lineup?: any[];
}

export interface Match {
  id: number;
  league: string;
  date: string;
  time: string;
  matchday?: number;
  status: 'FT' | 'LIVE' | 'HT' | 'TBD' | 'PP' | 'CAN' | 'SUS' | string;
  home: Team;
  away: Team;
  score: { home: number | null; away: number | null; halfTime?: { home: number; away: number } };
  venue: string;
  attendance?: number;
  competition?: string;
  referee?: string;
  goals?: any[];
  bookings?: any[];
  substitutions?: any[];
}

export interface ShotData {
  x: number;
  y: number;
  xG: number;
  result: string;
  isGoal: boolean;
  onTarget: boolean;
  player: string;
  minute: number;
  situation?: string;
  shotType?: string;
  isHome: boolean;
}

export interface PlayerStat {
  id: string;
  name: string;
  position: string;
  positionOrder: number;
  time: number;
  goals: number;
  assists: number;
  xG: number;
  xA: number;
  shots: number;
  keyPasses: number;
}

export interface UnderstatData {
  found: boolean;
  understatId?: string;
  stats?: {
    xG: [number, number];
    homeShots: ShotData[];
    awayShots: ShotData[];
    homeShotCount: number;
    awayShotCount: number;
    homeOnTarget: number;
    awayOnTarget: number;
    homeRoster: PlayerStat[];
    awayRoster: PlayerStat[];
  };
}

export interface Article {
  id: string;
  source: string;
  sourceId: string;
  sourceIcon?: string;
  title: string;
  link: string;
  description: string;
  pubDate: string;
  categories: string[];
}

export interface League {
  id: string;
  name: string;
  icon: string;
}

export const LEAGUES: League[] = [
  { id: 'all', name: 'All Leagues', icon: '⚽' },
  { id: 'pl', name: 'Premier League', icon: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { id: 'laliga', name: 'La Liga', icon: '🇪🇸' },
  { id: 'bundesliga', name: 'Bundesliga', icon: '🇩🇪' },
  { id: 'seriea', name: 'Serie A', icon: '🇮🇹' },
  { id: 'ligue1', name: 'Ligue 1', icon: '🇫🇷' },
  { id: 'ucl', name: 'Champions League', icon: '🏆' },
  { id: 'uel', name: 'Europa League', icon: '🏆' },
];
