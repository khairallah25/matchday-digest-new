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

// Season is typically the start year (e.g., 2025 for 2025/26)
function getCurrentSeason() {
  const now = new Date();
  return now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
}

/**
 * Scrapes Understat match page for xG, shot data, and player positions.
 * Understat embeds JSON in script tags which we parse out.
 */
async function scrapeUnderstatMatch(matchId) {
  const cacheKey = `understat:match:${matchId}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  try {
    const url = `https://understat.com/match/${matchId}`;
    const { data: html } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    // Extract JSON data from script tags
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
    const { data: html } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    const datesData = extractJSON(html, 'datesData');
    cache.set(cacheKey, datesData, 1800); // 30 min cache
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

  // Process shots for shot map
  const processShotForMap = (shot, isHome) => ({
    x: parseFloat(shot.X) * 100,
    y: parseFloat(shot.Y) * 100,
    xG: parseFloat(shot.xG || 0),
    result: shot.result, // 'Goal', 'SavedShot', 'MissedShots', 'BlockedShot', 'ShotOnPost'
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
    // Player positions from roster data
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
// Finds an Understat match ID by team names and date, then returns stats
router.get('/find', async (req, res) => {
  try {
    const { home, away, date, league } = req.query;
    const slug = LEAGUE_SLUGS[league];
    if (!slug) return res.json({ found: false, error: 'League not covered by Understat' });

    const season = getCurrentSeason();
    const datesData = await scrapeUnderstatLeague(slug, season);
    if (!datesData) return res.json({ found: false });

    // Find match by team names and date
    const targetDate = new Date(date);
    let foundMatch = null;

    for (const match of datesData) {
      const matchDate = new Date(match.datetime);
      const dayDiff = Math.abs(matchDate.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24);

      if (dayDiff <= 1) {
        const homeMatch = match.h?.title?.toLowerCase().includes(home?.toLowerCase()) ||
                          match.h?.short_title?.toLowerCase().includes(home?.toLowerCase()?.substring(0, 3));
        const awayMatch = match.a?.title?.toLowerCase().includes(away?.toLowerCase()) ||
                          match.a?.short_title?.toLowerCase().includes(away?.toLowerCase()?.substring(0, 3));

        if (homeMatch && awayMatch) {
          foundMatch = match;
          break;
        }
      }
    }

    if (!foundMatch) return res.json({ found: false });

    // Now scrape the full match data
    const matchData = await scrapeUnderstatMatch(foundMatch.id);
    res.json({ found: true, understatId: foundMatch.id, ...matchData });
  } catch (err) {
    console.error('[Understat] Find error:', err.message);
    res.json({ found: false, error: err.message });
  }
});

export { router as understatRoutes };
