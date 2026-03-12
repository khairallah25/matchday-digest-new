import { useState, useEffect, useCallback } from 'react';
import type { Match, UnderstatData, Article } from '../types';
import { fetchMatches, fetchMatchDetail, fetchUnderstatData, fetchMatchArticles } from '../lib/api';

// ─── Hook: fetch matches for a given week ───

export function useMatches(league: string, weekOffset: number) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMatches(league, weekOffset);
      setMatches(data);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to load matches');
    } finally {
      setLoading(false);
    }
  }, [league, weekOffset]);

  useEffect(() => { load(); }, [load]);

  return { matches, loading, error, reload: load };
}

// ─── Hook: fetch full match detail + understat + articles ───

export function useMatchDetail(matchId: number | null) {
  const [match, setMatch] = useState<Match | null>(null);
  const [understat, setUnderstat] = useState<UnderstatData | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!matchId) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        // 1. Fetch match detail from football-data.org
        const matchData = await fetchMatchDetail(matchId);
        if (cancelled) return;
        setMatch(matchData);

        // 2. In parallel, fetch understat data + articles
        const [uData, arts] = await Promise.all([
          fetchUnderstatData(
            matchData.home.name,
            matchData.away.name,
            matchData.date,
            matchData.league
          ),
          fetchMatchArticles(matchData.home.name, matchData.away.name),
        ]);

        if (cancelled) return;
        setUnderstat(uData);
        setArticles(arts);
      } catch (err: any) {
        if (!cancelled) {
          setError(err.response?.data?.message || err.message || 'Failed to load match');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [matchId]);

  return { match, understat, articles, loading, error };
}
