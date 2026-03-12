import { useState, useMemo } from 'react';
import { LEAGUES } from '../types';
import { useMatches } from '../hooks/useMatchData';
import { MatchCard } from '../components/MatchCard';
import { useIsMobile } from '../hooks/useIsMobile';

export function HomePage() {
  const [selectedLeague, setSelectedLeague] = useState('all');
  const [weekOffset, setWeekOffset] = useState(0);
  const { matches, loading, error } = useMatches('all', weekOffset);
  const mob = useIsMobile();

  const filteredMatches = useMemo(() => {
    if (selectedLeague === 'all') return matches;
    return matches.filter((mt) => mt.league === selectedLeague);
  }, [matches, selectedLeague]);

  const grouped = useMemo(() => {
    const g: Record<string, typeof matches> = {};
    filteredMatches.forEach((mt) => {
      const league = LEAGUES.find((l) => l.id === mt.league);
      const key = league?.name || mt.competition || mt.league;
      if (!g[key]) g[key] = [];
      g[key].push(mt);
    });
    return g;
  }, [filteredMatches]);

  const matchCounts = useMemo(() => {
    const c: Record<string, number> = {};
    LEAGUES.forEach((l) => {
      c[l.id] = l.id === 'all' ? matches.length : matches.filter((mt) => mt.league === l.id).length;
    });
    return c;
  }, [matches]);

  // Short league names for mobile
  const shortName = (l: typeof LEAGUES[0]) => {
    const map: Record<string, string> = { all: 'All', pl: 'PL', laliga: 'Liga', bundesliga: 'BuLi', seriea: 'Serie A', ligue1: 'L1', ucl: 'UCL', uel: 'UEL' };
    return map[l.id] || l.name;
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: mob ? '0 12px' : '0 24px' }}>
      {/* League filter */}
      <nav className="nav-scroll" style={{ display: 'flex', gap: 4, padding: '10px 0', overflowX: 'auto', borderBottom: '1px solid #e5e5e5', WebkitOverflowScrolling: 'touch' as any }}>
        {LEAGUES.map((l) => (
          <button key={l.id} onClick={() => setSelectedLeague(l.id)} style={{
            padding: mob ? '6px 12px' : '8px 16px', borderRadius: 20, border: 'none',
            backgroundColor: selectedLeague === l.id ? '#1a1a1a' : 'transparent',
            color: selectedLeague === l.id ? '#fff' : '#6b7280',
            fontSize: mob ? 12 : 13, fontWeight: selectedLeague === l.id ? 600 : 500,
            cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit', flexShrink: 0,
          }}>
            {l.icon} {mob ? shortName(l) : l.name}
            {matchCounts[l.id] > 0 ? ` (${matchCounts[l.id]})` : ''}
          </button>
        ))}
      </nav>

      {/* Week toggle */}
      <div className="nav-scroll" style={{ display: 'flex', gap: 0, margin: '16px 0 4px', borderBottom: '1px solid #e5e5e5', overflowX: 'auto' }}>
        {[{ offset: 0, label: 'This Week' }, { offset: -1, label: 'Last Week' }, { offset: -2, label: '2 Weeks Ago' }].map((w) => (
          <button key={w.offset} onClick={() => setWeekOffset(w.offset)} style={{
            padding: mob ? '10px 14px' : '12px 20px', border: 'none',
            borderBottom: weekOffset === w.offset ? '2px solid #111' : '2px solid transparent',
            backgroundColor: 'transparent', color: weekOffset === w.offset ? '#1a1a1a' : '#6b7280',
            fontSize: mob ? 13 : 14, fontWeight: weekOffset === w.offset ? 600 : 400,
            cursor: 'pointer', fontFamily: 'inherit', marginBottom: -1, whiteSpace: 'nowrap', flexShrink: 0,
          }}>
            {w.label}
          </button>
        ))}
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#9ca3af' }}>
          <div style={{ fontSize: 24, marginBottom: 12 }}>⚽</div>
          <p style={{ fontSize: 15 }}>Loading matches...</p>
        </div>
      )}

      {error && (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: mob ? 16 : 20, maxWidth: 500, margin: '0 auto' }}>
            <p style={{ fontSize: 14, color: '#dc2626', fontWeight: 600, marginBottom: 8 }}>Failed to load matches</p>
            <p style={{ fontSize: 13, color: '#6b7280' }}>{error}</p>
            <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 12 }}>
              Make sure your API key is set in <code style={{ backgroundColor: '#f5f5f4', padding: '2px 6px', borderRadius: 4 }}>.env</code>
            </p>
          </div>
        </div>
      )}

      {!loading && !error && Object.keys(grouped).length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#9ca3af' }}>
          <p style={{ fontSize: 15 }}>No matches found for this week.</p>
        </div>
      )}

      {!loading && !error && (
        <div style={{ paddingBottom: 40 }}>
          {Object.entries(grouped).map(([leagueName, leagueMatches]) => (
            <div key={leagueName} style={{ marginBottom: 8 }}>
              <div style={{ padding: '14px 0 8px', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, color: '#6b7280' }}>
                {leagueName}
              </div>
              {leagueMatches.map((mt) => <MatchCard key={mt.id} match={mt} />)}
            </div>
          ))}
        </div>
      )}

      <div style={{ textAlign: 'center', padding: '40px 0', fontSize: 12, color: '#9ca3af', borderTop: '1px solid #e5e5e5', marginTop: 40 }}>
        MatchDay Digest — Football news, stats & analysis aggregator.
      </div>
    </div>
  );
}
