import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Match } from '../types';
import { useIsMobile } from '../hooks/useIsMobile';

export function MatchCard({ match }: { match: Match }) {
  const [hovered, setHovered] = useState(false);
  const navigate = useNavigate();
  const m = useIsMobile();

  const hW = match.status === 'FT' && (match.score.home ?? 0) > (match.score.away ?? 0);
  const aW = match.status === 'FT' && (match.score.away ?? 0) > (match.score.home ?? 0);
  const isFinished = match.status === 'FT';

  return (
    <div
      onClick={() => navigate(`/match/${match.id}`)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        backgroundColor: '#fff',
        border: `1px solid ${hovered ? '#ccc' : '#e5e5e5'}`,
        borderRadius: 8,
        padding: m ? '12px 14px' : '16px 20px',
        marginBottom: 8,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        transition: 'all 0.15s',
        transform: hovered && !m ? 'translateY(-1px)' : 'none',
        boxShadow: hovered && !m ? '0 2px 8px rgba(0,0,0,0.04)' : 'none',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: m ? 4 : 6, flex: 1, minWidth: 0 }}>
        {/* Home team */}
        <div style={{ display: 'flex', alignItems: 'center', gap: m ? 8 : 10, fontSize: m ? 14 : 15 }}>
          {match.home.crest ? (
            <img src={match.home.crest} alt="" style={{ width: m ? 20 : 22, height: m ? 20 : 22, objectFit: 'contain', flexShrink: 0 }} />
          ) : (
            <span style={{ width: m ? 20 : 22, fontSize: 16, textAlign: 'center', flexShrink: 0 }}>⚽</span>
          )}
          <span style={{ fontWeight: hW ? 700 : 400, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {m ? (match.home.short || match.home.name) : match.home.name}
          </span>
          <span style={{ fontWeight: hW ? 700 : 400, width: 20, textAlign: 'center', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
            {isFinished ? match.score.home : ''}
          </span>
        </div>
        {/* Away team */}
        <div style={{ display: 'flex', alignItems: 'center', gap: m ? 8 : 10, fontSize: m ? 14 : 15 }}>
          {match.away.crest ? (
            <img src={match.away.crest} alt="" style={{ width: m ? 20 : 22, height: m ? 20 : 22, objectFit: 'contain', flexShrink: 0 }} />
          ) : (
            <span style={{ width: m ? 20 : 22, fontSize: 16, textAlign: 'center', flexShrink: 0 }}>⚽</span>
          )}
          <span style={{ fontWeight: aW ? 700 : 400, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {m ? (match.away.short || match.away.name) : match.away.name}
          </span>
          <span style={{ fontWeight: aW ? 700 : 400, width: 20, textAlign: 'center', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
            {isFinished ? match.score.away : ''}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2, marginLeft: m ? 12 : 20, flexShrink: 0 }}>
        <span style={{
          fontSize: 11, fontWeight: 600,
          color: match.status === 'FT' ? '#9ca3af' : match.status === 'LIVE' ? '#dc2626' : '#16a34a',
          textTransform: 'uppercase', letterSpacing: 0.5,
        }}>
          {match.status === 'TBD' ? match.time : match.status}
        </span>
        <span style={{ fontSize: m ? 11 : 12, color: '#9ca3af' }}>
          {new Date(match.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
        </span>
      </div>

      <span style={{ fontSize: 16, color: '#9ca3af', marginLeft: m ? 8 : 12 }}>›</span>
    </div>
  );
}
