import type { ShotData, PlayerStat } from '../types';

// ─── Shared Pitch SVG ───

function PitchSVG({ children, title }: { children: React.ReactNode; title?: string }) {
  return (
    <div style={{ backgroundColor: '#fff', border: '1px solid #e5e5e5', borderRadius: 8, overflow: 'hidden', marginBottom: 8 }}>
      {title && (
        <div style={{ padding: '12px 16px 0', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, color: '#6b7280' }}>
          {title}
        </div>
      )}
      <div style={{ padding: 12 }}>
        <svg viewBox="0 0 340 220" style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 4 }}>
          <rect x="0" y="0" width="340" height="220" fill="#2d8a4e" rx="4" />
          <rect x="10" y="10" width="320" height="200" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" />
          <line x1="170" y1="10" x2="170" y2="210" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" />
          <circle cx="170" cy="110" r="30" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" />
          <circle cx="170" cy="110" r="2.5" fill="rgba(255,255,255,0.7)" />
          <rect x="10" y="55" width="52" height="110" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" />
          <rect x="278" y="55" width="52" height="110" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" />
          <rect x="10" y="80" width="18" height="60" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" />
          <rect x="312" y="80" width="18" height="60" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" />
          <circle cx="46" cy="110" r="2" fill="rgba(255,255,255,0.7)" />
          <circle cx="294" cy="110" r="2" fill="rgba(255,255,255,0.7)" />
          {children}
        </svg>
      </div>
    </div>
  );
}

const px = (pct: number) => 10 + (pct / 100) * 320;
const py = (pct: number) => 10 + (pct / 100) * 200;

// ─── Shot Map ───

export function ShotMap({
  homeShots,
  awayShots,
  homeName,
  awayName,
}: {
  homeShots: ShotData[];
  awayShots: ShotData[];
  homeName: string;
  awayName: string;
}) {
  return (
    <PitchSVG title={`Shot Map — ${homeName} vs ${awayName}`}>
      {homeShots.map((s, i) => (
        <circle
          key={`h${i}`}
          cx={px(s.x)}
          cy={py(s.y)}
          r={4 + s.xG * 14}
          fill={s.isGoal ? '#facc15' : s.onTarget ? 'rgba(239,68,68,0.7)' : 'rgba(239,68,68,0.3)'}
          stroke={s.isGoal ? '#facc15' : 'rgba(239,68,68,0.5)'}
          strokeWidth={s.isGoal ? 2 : 1}
        >
          <title>{`${s.player} ${s.minute}' — xG: ${s.xG.toFixed(2)} (${s.result})`}</title>
        </circle>
      ))}
      {awayShots.map((s, i) => (
        <circle
          key={`a${i}`}
          cx={px(s.x)}
          cy={py(s.y)}
          r={4 + s.xG * 14}
          fill={s.isGoal ? '#facc15' : s.onTarget ? 'rgba(59,130,246,0.7)' : 'rgba(59,130,246,0.3)'}
          stroke={s.isGoal ? '#facc15' : 'rgba(59,130,246,0.5)'}
          strokeWidth={s.isGoal ? 2 : 1}
        >
          <title>{`${s.player} ${s.minute}' — xG: ${s.xG.toFixed(2)} (${s.result})`}</title>
        </circle>
      ))}
      <g transform="translate(12, 200)">
        <circle cx="0" cy="0" r="4" fill="rgba(239,68,68,0.7)" />
        <text x="8" y="3" fontSize="7" fill="white" fontFamily="Inter, sans-serif">{homeName}</text>
        <circle cx="65" cy="0" r="4" fill="rgba(59,130,246,0.7)" />
        <text x="73" y="3" fontSize="7" fill="white" fontFamily="Inter, sans-serif">{awayName}</text>
        <circle cx="140" cy="0" r="5" fill="#facc15" />
        <text x="148" y="3" fontSize="7" fill="white" fontFamily="Inter, sans-serif">Goal</text>
        <text x="185" y="3" fontSize="7" fill="rgba(255,255,255,0.6)" fontFamily="Inter, sans-serif">Size = xG</text>
      </g>
    </PitchSVG>
  );
}

// ─── Position Map (from Understat roster data) ───

// Map Understat position_order to approximate pitch coordinates
function getPositionCoords(posOrder: number, total: number, isAway: boolean): { x: number; y: number } {
  // Understat provides position_order 1-11
  // We'll use a generic mapping; real positions depend on formation
  const positions: Record<number, { x: number; y: number }> = {
    1: { x: 8, y: 50 },   // GK
    2: { x: 28, y: 15 },  // RB/RCB
    3: { x: 25, y: 38 },  // CB
    4: { x: 25, y: 62 },  // CB
    5: { x: 28, y: 85 },  // LB/LCB
    6: { x: 45, y: 30 },  // CM/DM
    7: { x: 45, y: 50 },  // CM
    8: { x: 45, y: 70 },  // CM
    9: { x: 68, y: 18 },  // RW/RM
    10: { x: 72, y: 50 }, // ST/CF
    11: { x: 68, y: 82 }, // LW/LM
  };

  const pos = positions[posOrder] || { x: 50, y: 50 };
  return isAway ? { x: 100 - pos.x, y: pos.y } : pos;
}

export function PositionMap({
  roster,
  teamName,
  color,
  isAway = false,
}: {
  roster: PlayerStat[];
  teamName: string;
  color: string;
  isAway?: boolean;
}) {
  // Only show starters (first 11 by position order, or those with time > 0)
  const starters = roster
    .filter((p) => p.positionOrder > 0)
    .sort((a, b) => a.positionOrder - b.positionOrder)
    .slice(0, 11);

  if (starters.length === 0) return null;

  return (
    <PitchSVG title={`${teamName} Average Positions`}>
      {starters.map((p, i) => {
        const coords = getPositionCoords(p.positionOrder, starters.length, isAway);
        const cx = px(coords.x);
        const cy = py(coords.y);
        const shortName = p.name.split(' ').pop() || p.name;
        return (
          <g key={p.id || i}>
            <circle cx={cx} cy={cy} r="12" fill={color} fillOpacity="0.85" stroke="white" strokeWidth="1.5" />
            <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="central" fill="white" fontSize="7.5" fontWeight="700" fontFamily="Inter, sans-serif">
              {p.positionOrder}
            </text>
            <text x={cx} y={cy + 20} textAnchor="middle" fill="white" fontSize="6" fontWeight="500" fillOpacity="0.85" fontFamily="Inter, sans-serif">
              {shortName}
            </text>
            <title>{`${p.name} — xG: ${p.xG.toFixed(2)}, Shots: ${p.shots}, Key Passes: ${p.keyPasses}`}</title>
          </g>
        );
      })}
    </PitchSVG>
  );
}

// ─── xG Timeline ───

export function XGTimeline({
  homeShots,
  awayShots,
  homeName,
  awayName,
}: {
  homeShots: ShotData[];
  awayShots: ShotData[];
  homeName: string;
  awayName: string;
}) {
  // Build cumulative xG over time
  const allEvents = [
    ...homeShots.map((s) => ({ ...s, team: 'home' as const })),
    ...awayShots.map((s) => ({ ...s, team: 'away' as const })),
  ].sort((a, b) => a.minute - b.minute);

  let homeXG = 0;
  let awayXG = 0;
  const points: { minute: number; homeXG: number; awayXG: number }[] = [{ minute: 0, homeXG: 0, awayXG: 0 }];

  for (const e of allEvents) {
    if (e.team === 'home') homeXG += e.xG;
    else awayXG += e.xG;
    points.push({ minute: e.minute, homeXG, awayXG });
  }
  points.push({ minute: 90, homeXG, awayXG });

  const maxXG = Math.max(homeXG, awayXG, 1);
  const w = 320;
  const h = 120;

  const toPath = (key: 'homeXG' | 'awayXG') => {
    return points
      .map((p, i) => {
        const x = 10 + (p.minute / 90) * w;
        const y = 10 + h - (p[key] / (maxXG * 1.2)) * h;
        return `${i === 0 ? 'M' : 'L'}${x},${y}`;
      })
      .join(' ');
  };

  return (
    <div style={{ backgroundColor: '#fff', border: '1px solid #e5e5e5', borderRadius: 8, overflow: 'hidden', marginBottom: 8 }}>
      <div style={{ padding: '12px 16px 0', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, color: '#6b7280' }}>
        xG Timeline
      </div>
      <div style={{ padding: 12 }}>
        <svg viewBox="0 0 340 150" style={{ width: '100%', height: 'auto', display: 'block' }}>
          <rect x="0" y="0" width="340" height="150" fill="#fafaf9" rx="4" />
          {/* Grid lines */}
          {[0, 15, 30, 45, 60, 75, 90].map((min) => (
            <g key={min}>
              <line x1={10 + (min / 90) * w} y1="10" x2={10 + (min / 90) * w} y2={10 + h} stroke="#e5e5e5" strokeWidth="0.5" />
              <text x={10 + (min / 90) * w} y={h + 25} textAnchor="middle" fontSize="8" fill="#9ca3af" fontFamily="Inter">{min}'</text>
            </g>
          ))}
          {/* xG lines */}
          <path d={toPath('homeXG')} fill="none" stroke="#ef4444" strokeWidth="2" />
          <path d={toPath('awayXG')} fill="none" stroke="#3b82f6" strokeWidth="2" />
          {/* Legend */}
          <line x1="12" y1="142" x2="28" y2="142" stroke="#ef4444" strokeWidth="2" />
          <text x="32" y="145" fontSize="8" fill="#6b7280" fontFamily="Inter">{homeName} ({homeXG.toFixed(2)})</text>
          <line x1="160" y1="142" x2="176" y2="142" stroke="#3b82f6" strokeWidth="2" />
          <text x="180" y="145" fontSize="8" fill="#6b7280" fontFamily="Inter">{awayName} ({awayXG.toFixed(2)})</text>
        </svg>
      </div>
    </div>
  );
}
