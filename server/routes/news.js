import { Router } from 'express';
import RSSParser from 'rss-parser';
import NodeCache from 'node-cache';

const router = Router();
const parser = new RSSParser();
const cache = new NodeCache({ stdTTL: 600 }); // 10 min cache for news

// RSS feed sources for football news
const RSS_FEEDS = [
  {
    id: 'bbc-football',
    name: 'BBC Sport Football',
    url: 'https://feeds.bbci.co.uk/sport/football/rss.xml',
    icon: 'https://www.bbc.co.uk/favicon.ico',
  },
  {
    id: 'guardian-football',
    name: 'The Guardian Football',
    url: 'https://www.theguardian.com/football/rss',
    icon: 'https://www.theguardian.com/favicon.ico',
  },
  {
    id: 'espn-football',
    name: 'ESPN FC',
    url: 'https://www.espn.com/espn/rss/soccer/news',
    icon: 'https://www.espn.com/favicon.ico',
  },
  {
    id: 'skysports-football',
    name: 'Sky Sports Football',
    url: 'https://www.skysports.com/rss/12040', // Football
    icon: 'https://www.skysports.com/favicon.ico',
  },
];

async function fetchFeed(feed) {
  const cacheKey = `rss:${feed.id}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  try {
    const parsed = await parser.parseURL(feed.url);
    const articles = (parsed.items || []).slice(0, 20).map((item) => ({
      id: item.guid || item.link,
      source: feed.name,
      sourceId: feed.id,
      sourceIcon: feed.icon,
      title: item.title || '',
      link: item.link || '',
      description: item.contentSnippet || item.content || '',
      pubDate: item.pubDate || item.isoDate || '',
      categories: item.categories || [],
    }));

    cache.set(cacheKey, articles);
    return articles;
  } catch (err) {
    console.error(`[RSS] Error fetching ${feed.name}:`, err.message);
    return [];
  }
}

// GET /api/news/articles?q=Arsenal+Chelsea
router.get('/articles', async (req, res) => {
  try {
    const { q } = req.query;

    // Fetch all feeds in parallel
    const results = await Promise.all(RSS_FEEDS.map(fetchFeed));
    let articles = results.flat();

    // Sort by date
    articles.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

    // Filter by search query if provided
    if (q) {
      const terms = q.toLowerCase().split(/[\s+]+/);
      articles = articles.filter((article) => {
        const text = `${article.title} ${article.description}`.toLowerCase();
        return terms.some((term) => text.includes(term));
      });
    }

    res.json(articles.slice(0, 50));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch news', message: err.message });
  }
});

// GET /api/news/match-articles?home=Arsenal&away=Chelsea
// Finds articles related to a specific match
router.get('/match-articles', async (req, res) => {
  try {
    const { home, away } = req.query;
    if (!home || !away) return res.status(400).json({ error: 'home and away params required' });

    const results = await Promise.all(RSS_FEEDS.map(fetchFeed));
    let articles = results.flat();

    // Filter for articles mentioning either team
    const homeTerms = home.toLowerCase().split(/\s+/);
    const awayTerms = away.toLowerCase().split(/\s+/);

    articles = articles.filter((article) => {
      const text = `${article.title} ${article.description}`.toLowerCase();
      const mentionsHome = homeTerms.some((t) => text.includes(t));
      const mentionsAway = awayTerms.some((t) => text.includes(t));
      return mentionsHome || mentionsAway;
    });

    // Boost articles mentioning both teams
    articles.sort((a, b) => {
      const aText = `${a.title} ${a.description}`.toLowerCase();
      const bText = `${b.title} ${b.description}`.toLowerCase();
      const aBoth = homeTerms.some((t) => aText.includes(t)) && awayTerms.some((t) => aText.includes(t));
      const bBoth = homeTerms.some((t) => bText.includes(t)) && awayTerms.some((t) => bText.includes(t));
      if (aBoth && !bBoth) return -1;
      if (!aBoth && bBoth) return 1;
      return new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime();
    });

    res.json(articles.slice(0, 20));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch match articles', message: err.message });
  }
});

export { router as newsRoutes };
