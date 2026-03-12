import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import NodeCache from 'node-cache';
import { footballDataRoutes } from './routes/footballData.js';
import { understatRoutes } from './routes/understat.js';
import { newsRoutes } from './routes/news.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Cache: 5 min for live data, 1 hour for historical
export const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/football', footballDataRoutes);
app.use('/api/understat', understatRoutes);
app.use('/api/news', newsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Production: serve built frontend from /dist
const distPath = join(__dirname, '..', 'dist');
app.use(express.static(distPath));

// SPA fallback — serve index.html for all non-API routes
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'Not found' });
  }
  res.sendFile(join(distPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[MatchDay Digest] Server running on port ${PORT}`);
  if (!process.env.FOOTBALL_DATA_API_KEY || process.env.FOOTBALL_DATA_API_KEY === 'your_api_key_here') {
    console.log('\n  WARNING: No API key configured!');
    console.log('   Get your free key at: https://www.football-data.org/client/register');
    console.log('   Then add it to .env as FOOTBALL_DATA_API_KEY=your_key\n');
  }
});
