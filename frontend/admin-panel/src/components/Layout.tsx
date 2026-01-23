import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  currentView: string;
  onNavigate: (view: string) => void;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentView, onNavigate, onLogout }) => {
  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-brand">Admin Panel</div>
        <nav>
          <div
            className={`nav-item ${currentView === 'dashboard' ? 'active' : ''}`}
            onClick={() => onNavigate('dashboard')}
          >
            Dashboard
          </div>
          <div
            className={`nav-item ${currentView === 'products' ? 'active' : ''}`}
            onClick={() => onNavigate('products')}
          >
            Products
          </div>
          <div
            className={`nav-item ${currentView === 'orders' ? 'active' : ''}`}
            onClick={() => onNavigate('orders')}
          >
            Orders
          </div>
        </nav>
      </aside>
      <div className="main-content">
        <header className="topbar">
          <h2 style={{textTransform: 'capitalize'}}>{currentView}</h2>
          <button className="btn btn-secondary" onClick={onLogout}>Logout</button>
        </header>
        <main className="page-content">
          {children}
        </main>
      </div>
    </div>
  );
};
