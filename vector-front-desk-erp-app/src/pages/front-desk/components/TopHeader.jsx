import { useAuth } from '../../../lib/auth';

export default function TopHeader() {
  const { profile } = useAuth();

  return (
    <header className="top-header" style={{
      backgroundColor: '#ffffff',
      height: '62px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 28px',
      borderBottom: '1px solid #e8edf3',
      boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      position: 'sticky',
      top: 0,
      zIndex: 300
    }}>
      <div className="header-left" style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
        <div style={{ fontSize: '16px', cursor: 'pointer', color: '#64748b' }}>
          <i className="fa-solid fa-bars"></i>
        </div>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#1e293b' }}>Dashboard</h2>
        <div className="search-box" style={{ position: 'relative' }}>
          <i className="fa-solid fa-magnifying-glass" style={{
            position: 'absolute',
            left: '13px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#94a3b8',
            fontSize: '12px',
            pointerEvents: 'none'
          }}></i>
          <input 
            type="text" 
            placeholder="Search everything..." 
            style={{
              width: '300px',
              padding: '8px 14px 8px 34px',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              backgroundColor: '#f8fafc',
              outline: 'none',
              fontSize: '12.5px',
              color: '#1e293b'
            }}
          />
        </div>
      </div>

      <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <div className="icon-badge" style={{
          position: 'relative',
          cursor: 'pointer',
          fontSize: '16px',
          color: '#64748b',
          width: '36px',
          height: '36px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '8px',
          transition: 'background 0.18s, color 0.18s'
        }}>
          <i className="fa-solid fa-calendar-days"></i>
          <span className="badge" style={{
            position: 'absolute',
            top: '4px',
            right: '4px',
            backgroundColor: '#ef4444',
            color: '#fff',
            fontSize: '8px',
            fontWeight: 700,
            minWidth: '16px',
            height: '16px',
            padding: '0 4px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid #fff'
          }}>0</span>
        </div>

        <div className="icon-badge" style={{
          position: 'relative',
          cursor: 'pointer',
          fontSize: '16px',
          color: '#64748b',
          width: '36px',
          height: '36px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '8px',
          transition: 'background 0.18s, color 0.18s'
        }}>
          <i className="fa-solid fa-bell"></i>
          <span className="badge" style={{
            position: 'absolute',
            top: '4px',
            right: '4px',
            backgroundColor: '#ef4444',
            color: '#fff',
            fontSize: '8px',
            fontWeight: 700,
            minWidth: '16px',
            height: '16px',
            padding: '0 4px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid #fff'
          }}>0</span>
        </div>

        <div className="icon-badge" style={{
          position: 'relative',
          cursor: 'pointer',
          fontSize: '16px',
          color: '#64748b',
          width: '36px',
          height: '36px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '8px',
          transition: 'background 0.18s, color 0.18s'
        }}>
          <i className="fa-solid fa-envelope"></i>
          <span className="badge" style={{
            position: 'absolute',
            top: '4px',
            right: '4px',
            backgroundColor: '#ef4444',
            color: '#fff',
            fontSize: '8px',
            fontWeight: 700,
            minWidth: '16px',
            height: '16px',
            padding: '0 4px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid #fff'
          }}>0</span>
        </div>

        <div className="header-divider" style={{
          width: '1px',
          height: '24px',
          background: '#e2e8f0',
          margin: '0 6px'
        }}></div>

        <div className="user-profile" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '5px 10px 5px 6px',
          borderRadius: '10px',
          cursor: 'pointer',
          transition: 'background 0.18s'
        }}>
          <div className="avatar" style={{
            width: '34px',
            height: '34px',
            borderRadius: '9px',
            background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '13px'
          }}>
            {profile?.username?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '12px', color: '#1e293b' }}>
              {profile?.username || 'User'}
            </div>
            <div style={{ fontSize: '10px', color: '#64748b' }}>Front Desk Officer</div>
          </div>
          <i className="fa-solid fa-chevron-down" style={{ fontSize: '10px', color: '#64748b', marginLeft: '4px' }}></i>
        </div>
      </div>
    </header>
  );
}