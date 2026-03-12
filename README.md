# MatchDay Digest

Football news, stats & analysis aggregator for the top 5 European leagues, Champions League, and Europa League.

## Quick Start

1. **Get a free API key** at [football-data.org/client/register](https://www.football-data.org/client/register)

2. **Clone and configure:**
   ```bash
   cd matchday-digest
   cp .env.example .env
   # Edit .env and add your API key
   ```

3. **Install and run:**
   ```bash
   npm install
   npm run dev
   ```

4. Open [http://localhost:5173](http://localhost:5173)

## Architecture

- **Frontend:** React + TypeScript + Vite (port 5173)
- **Backend:** Express API server (port 3001)
- **Data sources:**
  - [football-data.org](https://www.football-data.org/) — match scores, fixtures, lineups (free tier)
  - [Understat](https://understat.com/) — xG, shot maps, player positions (scraped)
  - RSS feeds — BBC Sport, The Guardian, ESPN, Sky Sports (free)

## Data Notes

- **football-data.org free tier** covers: Premier League, La Liga, Bundesliga, Serie A, Ligue 1, Champions League, Primeira Liga, Eredivisie, Championship
- **Understat** covers top 5 leagues only — CL/EL matches won't have advanced stats
- RSS articles are cached for 10 minutes; match data for 5 minutes; Understat data for 1 hour
