import React from 'react';
import { LayoutDashboard, Package, ShoppingCart, LogOut } from 'lucide-react';
import clsx from 'clsx';

interface AdminLayoutProps {
  children: React.ReactNode;
  currentView: string;
  onNavigate: (view: string) => void;
  onLogout: () => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children, currentView, onNavigate, onLogout }) => {
  const navButtonStyle: React.CSSProperties = {
    width: '100%',
    textAlign: 'left',
    background: 'none',
    border: 'none',
    color: 'inherit',
    font: 'inherit',
    cursor: 'pointer',
    padding: 0,
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'products', label: 'Products', icon: <Package size={20} /> },
    { id: 'orders', label: 'Orders', icon: <ShoppingCart size={20} /> },
  ];

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-brand">Admin Panel</div>
        <nav style={{ flex: 1 }}>
          {navItems.map(item => (
            <button
              type="button"
              key={item.id}
              style={navButtonStyle}
              aria-current={currentView === item.id ? 'page' : undefined}
              aria-label={`Go to ${item.label}`}
              onClick={() => onNavigate(item.id)}
            >
              <div
              className={clsx('nav-item', currentView === item.id && 'active')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}
            >
              {item.icon}
              <span>{item.label}</span>
            </div>
            </button>
          ))}
        </nav>
        <div style={{ padding: '1rem 0' }}>
            <button
              type="button"
              style={navButtonStyle}
              aria-label="Logout"
              onClick={onLogout}
            >
              <div
              className="nav-item"
              style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#ef4444' }}
            >
                <LogOut size={20} />
                <span>Logout</span>
            </div>
            </button>
        </div>
      </aside>
      <div className="main-content">
        <header className="topbar">
          <h2 style={{textTransform: 'capitalize'}}>{currentView}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
             <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>admin@example.com</span>
          </div>
        </header>
        <main className="page-content">
          {children}
        </main>
      </div>
    </div>
  );
};
