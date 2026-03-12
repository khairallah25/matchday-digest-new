import { useIsMobile } from '../hooks/useIsMobile';

export function StatBar({
  label,
  home,
  away,
  isPercentage = false,
  invert = false,
}: {
  label: string;
  home: string | number;
  away: string | number;
  isPercentage?: boolean;
  invert?: boolean;
}) {
  const m = useIsMobile();
  const hN = parseFloat(String(home));
  const aN = parseFloat(String(away));
  const total = hN + aN || 1;
  const hPct = (hN / total) * 100;
  const hBetter = invert ? hN < aN : hN > aN;
  const aBetter = invert ? aN < hN : aN > hN;

  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: m ? '8px 12px' : '10px 16px', borderBottom: '1px solid #e5e5e5' }}>
      <div style={{ flex: '0 0 ' + (m ? '36px' : '48px'), textAlign: 'right', fontSize: m ? 12 : 13, fontWeight: hBetter ? 700 : 400, fontVariantNumeric: 'tabular-nums' }}>
        {home}{isPercentage ? '%' : ''}
      </div>
      <div style={{ flex: '0 0 6px' }} />
      <div style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: '#e5e5e5', display: 'flex', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${hPct}%`, backgroundColor: '#111', borderRadius: '2px 0 0 2px' }} />
        <div style={{ height: '100%', width: `${100 - hPct}%`, backgroundColor: '#bbb', borderRadius: '0 2px 2px 0' }} />
      </div>
      <div style={{ flex: '0 0 ' + (m ? '72px' : '110px'), textAlign: 'center', fontSize: m ? 11 : 12, color: '#6b7280', fontWeight: 500 }}>{label}</div>
      <div style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: '#e5e5e5', display: 'flex', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${hPct}%`, backgroundColor: '#111' }} />
        <div style={{ height: '100%', width: `${100 - hPct}%`, backgroundColor: '#bbb' }} />
      </div>
      <div style={{ flex: '0 0 6px' }} />
      <div style={{ flex: '0 0 ' + (m ? '36px' : '48px'), textAlign: 'left', fontSize: m ? 12 : 13, fontWeight: aBetter ? 700 : 400, fontVariantNumeric: 'tabular-nums' }}>
        {away}{isPercentage ? '%' : ''}
      </div>
    </div>
  );
}
