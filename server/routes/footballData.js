import { Router } from 'express';
import axios from 'axios';
import NodeCache from 'node-cache';

const router = Router();
const cache = new NodeCache({ stdTTL: 300 }); // 5 min cache

const API_BASE = 'https://api.football-data.org/v4';

// Competition codes mapping
const COMPETITIONS = {
  pl: 'PL',        // Premier League
  laliga: 'PD',    // Primera Division (La Liga)
  bundesliga: 'BL1', // Bundesliga
  seriea: 'SA',    // Serie A
  ligue1: 'FL1',   // Ligue 1
  ucl: 'CL',       // Champions League
  uel: 'EC',       // Europa League (competition code may vary)
};

function getHeaders() {
  return {
    'X-Auth-Token': process.env.FOOTBALL_DATA_API_KEY || '',
  };
}

async function fetchFromAPI(endpoint) {
  const cacheKey = `fdata:${endpoint}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  try {
    const res = await axios.get(`${API_BASE}${endpoint}`, { headers: getHeaders() });
    cache.set(cacheKey, res.data);
    return res.data;
  } catch (err) {
    console.error(`[football-data.org] Error fetching ${endpoint}:`, err.response?.status, err.response?.data?.message);
    throw err;
  }
}

// GET /api/football/matches?league=pl&dateFrom=2026-03-04&dateTo=2026-03-11
router.get('/matches', async (req, res) => {
  try {
    const { league, dateFrom, dateTo } = req.query;

    if (league && league !== 'all') {
      const code = COMPETITIONS[league];
      if (!code) return res.status(400).json({ error: `Unknown league: ${league}` });

      const data = await fetchFromAPI(
        `/competitions/${code}/matches?dateFrom=${dateFrom}&dateTo=${dateTo}&status=FINISHED,SCHEDULED,IN_PLAY,PAUSED`
      );
      return res.json(normalizeMatches(data.matches, league));
    }

    // Fetch all competitions in parallel
    const promises = Object.entries(COMPETITIONS).map(async ([leagueId, code]) => {
      try {
        const data = await fetchFromAPI(
          `/competitions/${code}/matches?dateFrom=${dateFrom}&dateTo=${dateTo}&status=FINISHED,SCHEDULED,IN_PLAY,PAUSED`
        );
        return normalizeMatches(data.matches, leagueId);
      } catch {
        console.warn(`[football-data.org] Skipping ${leagueId} (${code}) — may not be in free tier`);
        return [];
      }
    });

    const results = await Promise.all(promises);
    const allMatches = results.flat().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    res.json(allMatches);
  } catch (err) {
    res.status(err.response?.status || 500).json({
      error: 'Failed to fetch matches',
      message: err.response?.data?.message || err.message,
    });
  }
});

// GET /api/football/match/:id
router.get('/match/:id', async (req, res) => {
  try {
    const data = await fetchFromAPI(`/matches/${req.params.id}`);
    res.json(normalizeMatchDetail(data));
  } catch (err) {
    res.status(err.response?.status || 500).json({
      error: 'Failed to fetch match',
      message: err.response?.data?.message || err.message,
    });
  }
});

// GET /api/football/standings?league=pl
router.get('/standings', async (req, res) => {
  try {
    const { league } = req.query;
    const code = COMPETITIONS[league] || 'PL';
    const data = await fetchFromAPI(`/competitions/${code}/standings`);
    res.json(data);
  } catch (err) {
    res.status(err.response?.status || 500).json({ error: 'Failed to fetch standings' });
  }
});

// ─── Normalize football-data.org response into our app format ───

function normalizeMatches(matches, leagueId) {
  if (!matches) return [];
  return matches.map((m) => ({
    id: m.id,
    league: leagueId,
    date: m.utcDate?.split('T')[0],
    time: m.utcDate ? new Date(m.utcDate).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '',
    matchday: m.matchday,
    status: normalizeStatus(m.status),
    home: {
      id: m.homeTeam?.id,
      name: m.homeTeam?.shortName || m.homeTeam?.name,
      short: m.homeTeam?.tla || '',
      crest: m.homeTeam?.crest || '',
    },
    away: {
      id: m.awayTeam?.id,
      name: m.awayTeam?.shortName || m.awayTeam?.name,
      short: m.awayTeam?.tla || '',
      crest: m.awayTeam?.crest || '',
    },
    score: {
      home: m.score?.fullTime?.home,
      away: m.score?.fullTime?.away,
    },
    venue: m.venue || '',
    competition: m.competition?.name || '',
  }));
}

function normalizeMatchDetail(m) {
  return {
    id: m.id,
    league: getLeagueIdFromCompetition(m.competition?.code),
    date: m.utcDate?.split('T')[0],
    time: m.utcDate ? new Date(m.utcDate).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '',
    matchday: m.matchday,
    status: normalizeStatus(m.status),
    home: {
      id: m.homeTeam?.id,
      name: m.homeTeam?.shortName || m.homeTeam?.name,
      short: m.homeTeam?.tla || '',
      crest: m.homeTeam?.crest || '',
      coach: m.homeTeam?.coach?.name,
      formation: m.homeTeam?.formation,
      lineup: m.homeTeam?.lineup,
    },
    away: {
      id: m.awayTeam?.id,
      name: m.awayTeam?.shortName || m.awayTeam?.name,
      short: m.awayTeam?.tla || '',
      crest: m.awayTeam?.crest || '',
      coach: m.awayTeam?.coach?.name,
      formation: m.awayTeam?.formation,
      lineup: m.awayTeam?.lineup,
    },
    score: {
      home: m.score?.fullTime?.home,
      away: m.score?.fullTime?.away,
      halfTime: m.score?.halfTime,
    },
    goals: m.goals || [],
    bookings: m.bookings || [],
    substitutions: m.substitutions || [],
    venue: m.venue || '',
    attendance: m.attendance,
    referee: m.referees?.[0]?.name || '',
    competition: m.competition?.name || '',
  };
}

function normalizeStatus(status) {
  const map = {
    FINISHED: 'FT',
    IN_PLAY: 'LIVE',
    PAUSED: 'HT',
    SCHEDULED: 'TBD',
    TIMED: 'TBD',
    POSTPONED: 'PP',
    CANCELLED: 'CAN',
    SUSPENDED: 'SUS',
  };
  return map[status] || status;
}

function getLeagueIdFromCompetition(code) {
  const reverse = Object.fromEntries(Object.entries(COMPETITIONS).map(([k, v]) => [v, k]));
  return reverse[code] || 'unknown';
}

export { router as footballDataRoutes };
