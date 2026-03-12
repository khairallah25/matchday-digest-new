import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMatchDetail } from '../hooks/useMatchData';
import { LEAGUES } from '../types';
import { StatBar } from '../components/StatBar';
import { ShotMap, PositionMap, XGTimeline } from '../components/PitchViz';
import { useIsMobile } from '../hooks/useIsMobile';

export function MatchPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const mob = useIsMobile();
  const matchId = id ? parseInt(id) : null;
  const { match, understat, articles, loading, error } = useMatchDetail(matchId);
  const [vizTab, setVizTab] = useState<'shots' | 'positions' | 'xg'>('shots');

  const pad = mob ? '0 12px' : '0 24px';

  if (loading) {
    return (
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '60px 24px', textAlign: 'center', color: '#9ca3af' }}>
        <div style={{ fontSize: 24, marginBottom: 12 }}>⚽</div>
        <p>Loading match data...</p>
        <p style={{ fontSize: 12, marginTop: 8, color: '#d1d5db' }}>Fetching stats from football-data.org + Understat...</p>
      </div>
    );
  }

  if (error || !match) {
    return (
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 16px' }}>
        <button onClick={() => navigate('/')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 0', border: 'none', backgroundColor: 'transparent', color: '#6b7280', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}>
          ← Back
        </button>
        <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: 20, marginTop: 20 }}>
          <p style={{ color: '#dc2626', fontWeight: 600 }}>Failed to load match</p>
          <p style={{ color: '#6b7280', fontSize: 13, marginTop: 4 }}>{error}</p>
        </div>
      </div>
    );
  }

  const league = LEAGUES.find((l) => l.id === match.league);
  const isFinished = match.status === 'FT';
  const hW = isFinished && (match.score.home ?? 0) > (match.score.away ?? 0);
  const aW = isFinished && (match.score.away ?? 0) > (match.score.home ?? 0);
  const hasUnderstat = understat?.found && understat.stats;
  const stats = understat?.stats;

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: pad }}>
      <button onClick={() => navigate('/')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 0', border: 'none', backgroundColor: 'transparent', color: '#6b7280', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}>
        ← Back
      </button>

      {/* ─── Score Header ─── */}
      <div style={{ textAlign: 'center', padding: mob ? '16px 0 24px' : '24px 0 32px' }}>
        <div style={{ fontSize: mob ? 11 : 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1.5, color: '#6b7280', marginBottom: mob ? 14 : 20 }}>
          {league?.icon} {match.competition || league?.name} {!isFinished ? '• Upcoming' : ''}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: mob ? 16 : 32, marginBottom: 8 }}>
          <div style={{ textAlign: 'center', minWidth: mob ? 70 : 120 }}>
            {match.home.crest ? (
              <img src={match.home.crest} alt="" style={{ width: mob ? 36 : 48, height: mob ? 36 : 48, objectFit: 'contain', marginBottom: 6 }} />
            ) : (
              <span style={{ fontSize: mob ? 32 : 40, display: 'block', marginBottom: 6 }}>🔴</span>
            )}
            <span style={{ fontSize: mob ? 13 : 16, fontWeight: 600, display: 'block' }}>{mob ? (match.home.short || match.home.name) : match.home.name}</span>
            {match.home.formation && <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{match.home.formation}</div>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: mob ? 8 : 12 }}>
            <span style={{ fontSize: mob ? 36 : 48, fontWeight: 700, fontVariantNumeric: 'tabular-nums', lineHeight: 1, opacity: aW ? 0.35 : 1 }}>
              {isFinished ? match.score.home : '-'}
            </span>
            <span style={{ fontSize: mob ? 24 : 32, fontWeight: 300, color: '#9ca3af' }}>:</span>
            <span style={{ fontSize: mob ? 36 : 48, fontWeight: 700, fontVariantNumeric: 'tabular-nums', lineHeight: 1, opacity: hW ? 0.35 : 1 }}>
              {isFinished ? match.score.away : '-'}
            </span>
          </div>
          <div style={{ textAlign: 'center', minWidth: mob ? 70 : 120 }}>
            {match.away.crest ? (
              <img src={match.away.crest} alt="" style={{ width: mob ? 36 : 48, height: mob ? 36 : 48, objectFit: 'contain', marginBottom: 6 }} />
            ) : (
              <span style={{ fontSize: mob ? 32 : 40, display: 'block', marginBottom: 6 }}>🔵</span>
            )}
            <span style={{ fontSize: mob ? 13 : 16, fontWeight: 600, display: 'block' }}>{mob ? (match.away.short || match.away.name) : match.away.name}</span>
            {match.away.formation && <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{match.away.formation}</div>}
          </div>
        </div>
        <div style={{ fontSize: mob ? 11 : 13, color: '#6b7280', marginTop: 10, lineHeight: 1.6 }}>
          {match.venue}
          {match.attendance ? ` • ${match.attendance.toLocaleString()}` : ''}
          <br style={mob ? {} : { display: 'none' }} />
          {!mob && ' • '}
          {new Date(match.date + 'T12:00:00').toLocaleDateString('en-US', mob ? { month: 'short', day: 'numeric' } : { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })} • {match.time}
          {match.referee ? ` • ${match.referee}` : ''}
        </div>

        {hasUnderstat && (
          <div style={{ marginTop: 12, display: 'flex', justifyContent: 'center' }}>
            <div style={{ backgroundColor: '#f5f5f4', borderRadius: 20, padding: '5px 14px', fontSize: 13 }}>
              <span style={{ fontWeight: 600 }}>xG:</span>{' '}
              <span style={{ fontWeight: 700 }}>{stats!.xG[0].toFixed(2)}</span>
              <span style={{ color: '#9ca3af', margin: '0 6px' }}>-</span>
              <span style={{ fontWeight: 700 }}>{stats!.xG[1].toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>

      {/* ─── Goals ─── */}
      {match.goals && match.goals.length > 0 && (
        <div style={{ backgroundColor: '#fff', border: '1px solid #e5e5e5', borderRadius: 8, padding: mob ? '12px 14px' : '16px 20px', marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#6b7280', marginBottom: 10 }}>Goals</div>
          {match.goals.map((g: any, i: number) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '5px 0', fontSize: mob ? 13 : 14, gap: 8 }}>
              <span style={{ fontWeight: 600, color: '#6b7280', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>{g.minute}'</span>
              <span style={{ fontWeight: 600, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.scorer?.name || 'Goal'}</span>
              {!mob && g.assist?.name && <span style={{ color: '#9ca3af' }}>({g.assist.name})</span>}
              <span style={{ fontSize: 11, color: '#9ca3af', flexShrink: 0 }}>{g.team?.name}</span>
            </div>
          ))}
        </div>
      )}

      {/* ─── Match Stats ─── */}
      {hasUnderstat && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#6b7280', marginBottom: 10 }}>Match Stats</div>
          <div style={{ backgroundColor: '#fff', border: '1px solid #e5e5e5', borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderBottom: '1px solid #e5e5e5' }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#6b7280' }}>{match.home.short || match.home.name}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#6b7280' }}>{match.away.short || match.away.name}</span>
            </div>
            <StatBar label="xG" home={stats!.xG[0].toFixed(2)} away={stats!.xG[1].toFixed(2)} />
            <StatBar label="Shots" home={stats!.homeShotCount} away={stats!.awayShotCount} />
            <StatBar label="On Target" home={stats!.homeOnTarget} away={stats!.awayOnTarget} />
          </div>
        </div>
      )}

      {/* ─── Pitch Visualizations ─── */}
      {hasUnderstat && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#6b7280', marginBottom: 10 }}>
            Visualizations <span style={{ fontWeight: 400, fontSize: 11, color: '#9ca3af' }}>via Understat</span>
          </div>
          <div className="nav-scroll" style={{ display: 'flex', gap: 0, marginBottom: 12, borderBottom: '1px solid #e5e5e5', overflowX: 'auto' }}>
            {([['shots', 'Shot Map'], ['xg', 'xG Timeline'], ['positions', 'Positions']] as const).map(([tabId, label]) => (
              <button key={tabId} onClick={() => setVizTab(tabId)} style={{
                padding: mob ? '8px 14px' : '10px 18px', border: 'none',
                borderBottom: vizTab === tabId ? '2px solid #111' : '2px solid transparent',
                backgroundColor: 'transparent', color: vizTab === tabId ? '#1a1a1a' : '#6b7280',
                fontSize: 13, fontWeight: vizTab === tabId ? 600 : 400,
                cursor: 'pointer', fontFamily: 'inherit', marginBottom: -1, whiteSpace: 'nowrap', flexShrink: 0,
              }}>
                {label}
              </button>
            ))}
          </div>

          {vizTab === 'shots' && stats!.homeShots.length > 0 && (
            <ShotMap homeShots={stats!.homeShots} awayShots={stats!.awayShots} homeName={match.home.short || match.home.name} awayName={match.away.short || match.away.name} />
          )}

          {vizTab === 'xg' && (
            <XGTimeline homeShots={stats!.homeShots} awayShots={stats!.awayShots} homeName={match.home.short || match.home.name} awayName={match.away.short || match.away.name} />
          )}

          {vizTab === 'positions' && (
            <div style={{ display: 'grid', gridTemplateColumns: mob ? '1fr' : '1fr 1fr', gap: 8 }}>
              {stats!.homeRoster.length > 0 && <PositionMap roster={stats!.homeRoster} teamName={match.home.name} color="#ef4444" />}
              {stats!.awayRoster.length > 0 && <PositionMap roster={stats!.awayRoster} teamName={match.away.name} color="#3b82f6" isAway />}
            </div>
          )}

          {vizTab === 'shots' && stats!.homeShots.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af', fontSize: 14 }}>No shot data available.</div>
          )}
        </div>
      )}

      {/* ─── Articles ─── */}
      {articles.length > 0 && (
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#6b7280', marginBottom: 10 }}>
            Coverage ({articles.length})
          </div>
          {articles.map((a) => (
            <a key={a.id} href={a.link} target="_blank" rel="noopener noreferrer"
              style={{ display: 'block', backgroundColor: '#fff', border: '1px solid #e5e5e5', borderRadius: 8, padding: mob ? '14px 14px' : '20px 24px', marginBottom: 8, textDecoration: 'none', color: 'inherit' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 12, backgroundColor: '#f0f0f0', fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {a.source}
                </span>
              </div>
              <div style={{ fontSize: mob ? 15 : 17, fontWeight: 600, lineHeight: 1.4, marginBottom: 6 }}>{a.title}</div>
              {!mob && a.description && (
                <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.5, maxHeight: 40, overflow: 'hidden' }}>
                  {a.description.substring(0, 150)}{a.description.length > 150 ? '...' : ''}
                </div>
              )}
              <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 6 }}>
                {a.pubDate ? new Date(a.pubDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
              </div>
            </a>
          ))}
        </div>
      )}

      {articles.length === 0 && !loading && (
        <div style={{ textAlign: 'center', padding: '32px 0', color: '#9ca3af', fontSize: 14, marginBottom: 40 }}>
          No articles found for this match yet.
        </div>
      )}

      {!hasUnderstat && isFinished && (
        <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: mob ? 12 : 16, marginBottom: 28, fontSize: 13, color: '#92400e' }}>
          <strong>Note:</strong> Advanced stats (xG, shot maps, position maps) are not available for this match.
          {understat?.reason && <span> Reason: {understat.reason}</span>}
          {!understat?.reason && match.league === 'ucl' || match.league === 'uel'
            ? ' Understat covers top 5 leagues only — CL/EL matches won\'t have advanced stats.'
            : ' This could be due to Understat being temporarily unavailable or the match not being found in their database.'}
        </div>
      )}

      {/* ─── Lineups ─── */}
      {isFinished && match.home.lineup && match.home.lineup.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#6b7280', marginBottom: 10 }}>Lineups</div>
          <div style={{ display: 'grid', gridTemplateColumns: mob ? '1fr' : '1fr 1fr', gap: 12 }}>
            <div style={{ backgroundColor: '#fff', border: '1px solid #e5e5e5', borderRadius: 8, padding: mob ? 12 : 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>{match.home.name} {match.home.formation ? `(${match.home.formation})` : ''}</div>
              {match.home.coach && <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>Coach: {match.home.coach}</div>}
              {match.home.lineup.map((p: any, i: number) => (
                <div key={i} style={{ fontSize: 13, padding: '3px 0', display: 'flex', gap: 8 }}>
                  <span style={{ color: '#9ca3af', fontVariantNumeric: 'tabular-nums', width: 24 }}>{p.shirtNumber}</span>
                  <span>{p.name}</span>
                </div>
              ))}
            </div>
            <div style={{ backgroundColor: '#fff', border: '1px solid #e5e5e5', borderRadius: 8, padding: mob ? 12 : 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>{match.away.name} {match.away.formation ? `(${match.away.formation})` : ''}</div>
              {match.away.coach && <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>Coach: {match.away.coach}</div>}
              {match.away.lineup?.map((p: any, i: number) => (
                <div key={i} style={{ fontSize: 13, padding: '3px 0', display: 'flex', gap: 8 }}>
                  <span style={{ color: '#9ca3af', fontVariantNumeric: 'tabular-nums', width: 24 }}>{p.shirtNumber}</span>
                  <span>{p.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div style={{ textAlign: 'center', padding: '40px 0', fontSize: 12, color: '#9ca3af', borderTop: '1px solid #e5e5e5', marginTop: 40 }}>
        MatchDay Digest — football-data.org + Understat + RSS
      </div>
    </div>
  );
}
