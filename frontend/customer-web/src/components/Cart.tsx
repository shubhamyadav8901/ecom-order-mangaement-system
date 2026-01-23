import React from 'react';

// For now, Cart component manages its own state or displays a placeholder
// because App.tsx is not passing props in the current refactor.
// In a real app, Cart state would be lifted to Context or Redux.

export const Cart: React.FC = () => {
  return (
    <div className="card" style={{ marginTop: '2rem' }}>
      <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Shopping Cart</h3>
      <p style={{ color: 'var(--text-light)', padding: '2rem 0', textAlign: 'center' }}>
        Your cart is currently empty.
        <br />
        <span style={{ fontSize: '0.875rem' }}>(Cart functionality is pending state implementation)</span>
      </p>
      <div style={{ textAlign: 'right', marginTop: '1rem' }}>
         <button className="btn btn-accent" disabled style={{ opacity: 0.5, cursor: 'not-allowed' }}>Checkout</button>
      </div>
    </div>
  );
};
