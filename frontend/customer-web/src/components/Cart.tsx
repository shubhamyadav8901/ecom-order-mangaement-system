import React from 'react';

interface Props {
  items: any[];
  onRemove: (id: number) => void;
  onClear: () => void;
  onCheckout: () => void;
}

export const Cart: React.FC<Props> = ({ items, onRemove, onClear, onCheckout }) => {
  const total = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  if (items.length === 0) {
    return (
      <div className="card" style={{ marginTop: '2rem' }}>
        <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Shopping Cart</h3>
        <p style={{ color: 'var(--text-light)', padding: '2rem 0', textAlign: 'center' }}>
          Your cart is currently empty.
        </p>
      </div>
    );
  }

  return (
    <div className="card" style={{ marginTop: '2rem' }}>
      <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Shopping Cart</h3>
      <table className="table">
        <thead>
          <tr>
            <th>Product</th>
            <th>Price</th>
            <th>Qty</th>
            <th>Total</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {items.map(item => (
            <tr key={item.product.id}>
              <td>{item.product.name}</td>
              <td>${item.product.price.toFixed(2)}</td>
              <td>{item.quantity}</td>
              <td>${(item.product.price * item.quantity).toFixed(2)}</td>
              <td>
                <button
                  onClick={() => onRemove(item.product.id)}
                  style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                >
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
        <button onClick={onClear} style={{ color: '#64748b', background: 'none', border: 'none', cursor: 'pointer' }}>Clear Cart</button>
        <div style={{ textAlign: 'right' }}>
           <div style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
             Total: ${total.toFixed(2)}
           </div>
           <button className="btn btn-accent" onClick={onCheckout}>Checkout</button>
        </div>
      </div>
    </div>
  );
};
