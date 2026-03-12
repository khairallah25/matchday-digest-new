import { Router } from 'express';
import axios from 'axios';
import NodeCache from 'node-cache';

const router = Router();
const cache = new NodeCache({ stdTTL: 3600 }); // 1 hour cache for historical stats

// Understat league slugs
const LEAGUE_SLUGS = {
  pl: 'EPL',
  laliga: 'La_liga',
  bundesliga: 'Bundesliga',
  seriea: 'Serie_A',
  ligue1: 'Ligue_1',
};

// Rotate user agents to reduce chance of being blocked
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:123.0) Gecko/20100101 Firefox/123.0',
];

function getRandomUA() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

function getHeaders() {
  return {
    'User-Agent': getRandomUA(),
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Cache-Control': 'max-age=0',
  };
}

// Season is typically the start year (e.g., 2025 for 2025/26)
function getCurrentSeason() {
  const now = new Date();
  return now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
}

/**
 * Fetch with retry logic
 */
async function fetchWithRetry(url, maxRetries = 2) {
  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const { data } = await axios.get(url, {
        headers: getHeaders(),
        timeout: 15000,
        maxRedirects: 5,
      });
      return data;
    } catch (err) {
      lastError = err;
      console.warn(`[Understat] Attempt ${attempt + 1} failed for ${url}: ${err.message}`);
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
      }
    }
  }
  throw lastError;
}

/**
 * Scrapes Understat match page for xG, shot data, and player positions.
 */
async function scrapeUnderstatMatch(matchId) {
  const cacheKey = `understat:match:${matchId}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  try {
    const url = `https://understat.com/match/${matchId}`;
    const html = await fetchWithRetry(url);

    const shotsData = extractJSON(html, 'shotsData');
    const rostersData = extractJSON(html, 'rostersData');
    const matchInfo = extractJSON(html, 'match_info');

    const result = {
      matchId,
      shots: shotsData,
      rosters: rostersData,
      matchInfo,
      stats: calculateAdvancedStats(shotsData, rostersData),
    };

    cache.set(cacheKey, result);
    return result;
  } catch (err) {
    console.error(`[Understat] Error scraping match ${matchId}:`, err.message);
    return null;
  }
}

/**
 * Scrapes Understat league page to get match IDs for date range lookup.
 */
async function scrapeUnderstatLeague(leagueSlug, season) {
  const cacheKey = `understat:league:${leagueSlug}:${season}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  try {
    const url = `https://understat.com/league/${leagueSlug}/${season}`;
    const html = await fetchWithRetry(url);

    const datesData = extractJSON(html, 'datesData');
    cache.set(cacheKey, datesData, 1800);
    return datesData;
  } catch (err) {
    console.error(`[Understat] Error scraping league ${leagueSlug}:`, err.message);
    return null;
  }
}

/**
 * Extract encoded JSON from Understat HTML.
 * Understat puts data in: var variableName = JSON.parse('...');
 */
function extractJSON(html, varName) {
  try {
    const regex = new RegExp(`var\\s+${varName}\\s*=\\s*JSON\\.parse\\('(.+?)'\\)`, 's');
    const match = html.match(regex);
    if (!match) return null;

    // Understat hex-encodes special characters
    const decoded = match[1]
      .replace(/\\x([0-9A-Fa-f]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
      .replace(/\\'/g, "'")
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\');

    return JSON.parse(decoded);
  } catch (err) {
    console.error(`[Understat] Failed to parse ${varName}:`, err.message);
    return null;
  }
}

/**
 * Calculate advanced stats from shot-level data.
 */
function calculateAdvancedStats(shotsData, rostersData) {
  if (!shotsData) return null;

  const homeShots = shotsData.h || [];
  const awayShots = shotsData.a || [];

  const homeXG = homeShots.reduce((sum, s) => sum + parseFloat(s.xG || 0), 0);
  const awayXG = awayShots.reduce((sum, s) => sum + parseFloat(s.xG || 0), 0);

  const processShotForMap = (shot, isHome) => ({
    x: parseFloat(shot.X) * 100,
    y: parseFloat(shot.Y) * 100,
    xG: parseFloat(shot.xG || 0),
    result: shot.result,
    isGoal: shot.result === 'Goal',
    onTarget: shot.result === 'Goal' || shot.result === 'SavedShot',
    player: shot.player,
    minute: parseInt(shot.minute),
    situation: shot.situation,
    shotType: shot.shotType,
    isHome,
  });

  return {
    xG: [parseFloat(homeXG.toFixed(2)), parseFloat(awayXG.toFixed(2))],
    homeShots: homeShots.map((s) => processShotForMap(s, true)),
    awayShots: awayShots.map((s) => processShotForMap(s, false)),
    homeShotCount: homeShots.length,
    awayShotCount: awayShots.length,
    homeOnTarget: homeShots.filter((s) => s.result === 'Goal' || s.result === 'SavedShot').length,
    awayOnTarget: awayShots.filter((s) => s.result === 'Goal' || s.result === 'SavedShot').length,
    homeRoster: rostersData?.h ? Object.values(rostersData.h).map(normalizePlayer) : [],
    awayRoster: rostersData?.a ? Object.values(rostersData.a).map(normalizePlayer) : [],
  };
}

function normalizePlayer(p) {
  return {
    id: p.id,
    name: p.player,
    position: p.position,
    positionOrder: parseInt(p.position_order || 0),
    time: parseInt(p.time || 0),
    goals: parseInt(p.goals || 0),
    assists: parseInt(p.assists || 0),
    xG: parseFloat(p.xG || 0),
    xA: parseFloat(p.xA || 0),
    shots: parseInt(p.shots || 0),
    keyPasses: parseInt(p.key_passes || 0),
  };
}

// ─── Routes ───

// GET /api/understat/match/:matchId
router.get('/match/:matchId', async (req, res) => {
  const data = await scrapeUnderstatMatch(req.params.matchId);
  if (!data) return res.status(404).json({ error: 'Match not found on Understat' });
  res.json(data);
});

// GET /api/understat/league/:league?season=2025
router.get('/league/:league', async (req, res) => {
  const slug = LEAGUE_SLUGS[req.params.league];
  if (!slug) return res.status(400).json({ error: `Unknown league: ${req.params.league}` });

  const season = req.query.season || getCurrentSeason();
  const data = await scrapeUnderstatLeague(slug, season);
  if (!data) return res.status(404).json({ error: 'League data not found' });
  res.json(data);
});

// GET /api/understat/find?home=Arsenal&away=Chelsea&date=2026-03-10&league=pl
router.get('/find', async (req, res) => {
  try {
    const { home, away, date, league } = req.query;
    const slug = LEAGUE_SLUGS[league];
    if (!slug) return res.json({ found: false, reason: 'League not covered by Understat (CL/EL not supported)' });

    const season = getCurrentSeason();
    console.log(`[Understat] Finding match: ${home} vs ${away} on ${date} in ${slug} (season ${season})`);

    const datesData = await scrapeUnderstatLeague(slug, season);
    if (!datesData) {
      console.warn(`[Understat] Could not fetch league data for ${slug}`);
      return res.json({ found: false, reason: 'Could not fetch league data from Understat' });
    }

    // Find match by team names and date
    const targetDate = new Date(date);
    let foundMatch = null;

    for (const match of datesData) {
      const matchDate = new Date(match.datetime);
      const dayDiff = Math.abs(matchDate.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24);

      if (dayDiff <= 1) {
        const homeLower = home?.toLowerCase() || '';
        const awayLower = away?.toLowerCase() || '';

        const homeMatch = match.h?.title?.toLowerCase().includes(homeLower) ||
                          homeLower.includes(match.h?.title?.toLowerCase() || '___') ||
                          match.h?.short_title?.toLowerCase().includes(homeLower?.substring(0, 3));
        const awayMatch = match.a?.title?.toLowerCase().includes(awayLower) ||
                          awayLower.includes(match.a?.title?.toLowerCase() || '___') ||
                          match.a?.short_title?.toLowerCase().includes(awayLower?.substring(0, 3));

        if (homeMatch && awayMatch) {
          foundMatch = match;
          break;
        }
      }
    }

    if (!foundMatch) {
      console.warn(`[Understat] No match found for ${home} vs ${away} on ${date}`);
      return res.json({ found: false, reason: 'Match not found in Understat data' });
    }

    console.log(`[Understat] Found match ID: ${foundMatch.id}`);
    const matchData = await scrapeUnderstatMatch(foundMatch.id);
    if (!matchData) {
      return res.json({ found: false, reason: 'Could not scrape match details' });
    }

    res.json({ found: true, understatId: foundMatch.id, ...matchData });
  } catch (err) {
    console.error('[Understat] Find error:', err.message);
    res.json({ found: false, reason: err.message });
  }
});

// GET /api/understat/status — check if Understat is reachable
router.get('/status', async (req, res) => {
  try {
    const { data } = await axios.get('https://understat.com', {
      headers: getHeaders(),
      timeout: 10000,
    });
    const reachable = data && data.includes('understat');
    res.json({ reachable, message: reachable ? 'Understat is accessible' : 'Unexpected response from Understat' });
  } catch (err) {
    res.json({ reachable: false, message: `Cannot reach Understat: ${err.message}` });
  }
});

export { router as understatRoutes };
