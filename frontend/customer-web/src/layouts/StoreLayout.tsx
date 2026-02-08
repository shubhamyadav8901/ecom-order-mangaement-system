import React from 'react';
import { ShoppingCart, LogOut } from 'lucide-react';
import { Button } from '@shared/ui/Button';

interface StoreLayoutProps {
  children: React.ReactNode;
  currentView: string;
  onNavigate: (view: string) => void;
  cartCount: number;
  isLoggedIn: boolean;
  onLogout: () => void;
}

export const StoreLayout: React.FC<StoreLayoutProps> = ({
  children, currentView, onNavigate, cartCount, isLoggedIn, onLogout
}) => {
  const navButtonStyle: React.CSSProperties = {
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    padding: 0,
    font: 'inherit',
    color: 'inherit',
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <nav style={{ background: '#131921', borderBottom: '1px solid #0f1111', position: 'sticky', top: 0, zIndex: 10 }}>
        <div className="container" style={{ maxWidth: '1320px', margin: '0 auto', padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => onNavigate('catalog')}
            style={{ ...navButtonStyle, fontSize: '1.4rem', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            aria-label="Go to catalog"
          >
            StoreFront
          </button>

          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', color: '#e5e7eb' }}>
            <button
               type="button"
               style={{ ...navButtonStyle, fontWeight: currentView === 'catalog' ? 700 : 500 }}
               onClick={() => onNavigate('catalog')}
            >
              Shop
            </button>

            {isLoggedIn && (
              <>
                <button
                  type="button"
                  style={{ ...navButtonStyle, position: 'relative', display: 'flex', alignItems: 'center' }}
                  onClick={() => onNavigate('cart')}
                  aria-label="Cart"
                >
                  <ShoppingCart size={24} />
                  {cartCount > 0 && (
                    <span style={{
                      position: 'absolute', top: -8, right: -8,
                      background: '#f59e0b', color: '#111827',
                      borderRadius: '50%', width: '18px', height: '18px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.75rem', fontWeight: 600
                    }}>
                      {cartCount}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  style={{ ...navButtonStyle, fontWeight: currentView === 'orders' ? 700 : 500 }}
                  onClick={() => onNavigate('orders')}
                >
                  Orders
                </button>

                <Button variant="ghost" onClick={onLogout} style={{ padding: '0.25rem 0.5rem', color: '#e5e7eb' }}>
                   <LogOut size={18} />
                </Button>
              </>
            )}

            {!isLoggedIn && (
               <span style={{ color: '#d1d5db', fontSize: '0.875rem' }}>Please Login</span>
            )}
          </div>
        </div>
        <div style={{ background: '#232f3e', borderTop: '1px solid #1f2937' }}>
          <div className="container" style={{ maxWidth: '1320px', margin: '0 auto', padding: '0.5rem 1rem', display: 'flex', gap: '1rem', overflowX: 'auto' }}>
            {['Top Deals', 'Mobiles', 'Books', 'Electronics', 'Fashion', 'Home & Kitchen'].map((label) => (
              <span key={label} style={{ color: '#f3f4f6', fontSize: '0.875rem', whiteSpace: 'nowrap' }}>{label}</span>
            ))}
          </div>
        </div>
      </nav>

      <main style={{ flex: 1, background: '#f1f3f6' }}>
        <div className="container" style={{ maxWidth: '1320px', margin: '0 auto', padding: '1.5rem 1rem' }}>
          {children}
        </div>
      </main>

      <footer style={{ background: '#172337', color: 'white', padding: '2rem 0' }}>
        <div className="container" style={{ maxWidth: '1320px', margin: '0 auto', textAlign: 'center' }}>
          <p style={{ color: '#9ca3af' }}>&copy; 2026 StoreFront Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};
