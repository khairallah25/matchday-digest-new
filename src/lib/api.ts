import axios from 'axios';
import type { Match, UnderstatData, Article } from '../types';

const api = axios.create({ baseURL: '/api' });

// ─── Date helpers ───

export function getWeekRange(weekOffset = 0): { dateFrom: string; dateTo: string } {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1) + weekOffset * 7);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  return {
    dateFrom: monday.toISOString().split('T')[0],
    dateTo: sunday.toISOString().split('T')[0],
  };
}

// ─── Football Data API ───

export async function fetchMatches(league = 'all', weekOffset = 0): Promise<Match[]> {
  const { dateFrom, dateTo } = getWeekRange(weekOffset);
  const params: any = { dateFrom, dateTo };
  if (league !== 'all') params.league = league;

  const { data } = await api.get('/football/matches', { params });
  return data;
}

export async function fetchMatchDetail(matchId: number): Promise<Match> {
  const { data } = await api.get(`/football/match/${matchId}`);
  return data;
}

// ─── Understat ───

export async function fetchUnderstatData(
  home: string,
  away: string,
  date: string,
  league: string
): Promise<UnderstatData> {
  try {
    const { data } = await api.get('/understat/find', {
      params: { home, away, date, league },
    });
    return data;
  } catch {
    return { found: false };
  }
}

// ─── News ───

export async function fetchMatchArticles(home: string, away: string): Promise<Article[]> {
  try {
    const { data } = await api.get('/news/match-articles', {
      params: { home, away },
    });
    return data;
  } catch {
    return [];
  }
}

export async function fetchNews(query?: string): Promise<Article[]> {
  try {
    const { data } = await api.get('/news/articles', {
      params: query ? { q: query } : {},
    });
    return data;
  } catch {
    return [];
  }
}
