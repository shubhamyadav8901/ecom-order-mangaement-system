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
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <nav style={{ background: 'white', borderBottom: '1px solid #e5e7eb', position: 'sticky', top: 0, zIndex: 10 }}>
        <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div
            onClick={() => onNavigate('catalog')}
            style={{ fontSize: '1.5rem', fontWeight: 700, color: '#2563eb', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            StoreFront
          </div>

          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <div
               style={{ cursor: 'pointer', fontWeight: currentView === 'catalog' ? 600 : 400 }}
               onClick={() => onNavigate('catalog')}
            >
              Shop
            </div>

            {isLoggedIn && (
              <>
                <div
                  style={{ cursor: 'pointer', position: 'relative', display: 'flex', alignItems: 'center' }}
                  onClick={() => onNavigate('cart')}
                  aria-label="Cart"
                >
                  <ShoppingCart size={24} />
                  {cartCount > 0 && (
                    <span style={{
                      position: 'absolute', top: -8, right: -8,
                      background: '#ef4444', color: 'white',
                      borderRadius: '50%', width: '18px', height: '18px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.75rem', fontWeight: 600
                    }}>
                      {cartCount}
                    </span>
                  )}
                </div>

                <div
                  style={{ cursor: 'pointer', fontWeight: currentView === 'orders' ? 600 : 400 }}
                  onClick={() => onNavigate('orders')}
                >
                  Orders
                </div>

                <Button variant="ghost" onClick={onLogout} style={{ padding: '0.25rem 0.5rem' }}>
                   <LogOut size={18} />
                </Button>
              </>
            )}

            {!isLoggedIn && (
               <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>Please Login</span>
            )}
          </div>
        </div>
      </nav>

      <main style={{ flex: 1, background: '#f9fafb' }}>
        <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' }}>
          {children}
        </div>
      </main>

      <footer style={{ background: '#1f2937', color: 'white', padding: '3rem 0' }}>
        <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
          <p style={{ color: '#9ca3af' }}>&copy; 2026 StoreFront Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};
