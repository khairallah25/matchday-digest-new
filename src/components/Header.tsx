import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '../hooks/useIsMobile';

export function Header() {
  const navigate = useNavigate();
  const m = useIsMobile();

  return (
    <header style={{ backgroundColor: '#111', color: '#fff', position: 'sticky', top: 0, zIndex: 100, borderBottom: '1px solid #333' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: m ? '12px 16px' : '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div
          style={{ fontSize: m ? 16 : 20, fontWeight: 700, letterSpacing: -0.5, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
          onClick={() => navigate('/')}
        >
          ⚽ MatchDay <span style={{ color: '#a3a3a3', fontWeight: 400 }}>Digest</span>
        </div>
        {!m && (
          <div style={{ fontSize: 13, color: '#a3a3a3' }}>
            {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </div>
        )}
      </div>
    </header>
  );
}
