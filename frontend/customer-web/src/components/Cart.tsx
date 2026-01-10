import React from 'react';

interface CartItem {
  product: { id: number; name: string; price: number };
  quantity: number;
}

interface CartProps {
  items: CartItem[];
  onCheckout: () => void;
  clearCart: () => void;
}

export const Cart: React.FC<CartProps> = ({ items, onCheckout, clearCart }) => {
  const total = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

  if (items.length === 0) return <p>Cart is empty</p>;

  return (
    <div style={{ padding: '20px', border: '1px solid #ddd', marginTop: '20px' }}>
      <h3>Your Cart</h3>
      <ul>
        {items.map((item, idx) => (
          <li key={idx}>
            {item.product.name} x {item.quantity} - ${item.product.price * item.quantity}
          </li>
        ))}
      </ul>
      <h4>Total: ${total.toFixed(2)}</h4>
      <div style={{ display: 'flex', gap: '10px' }}>
        <button onClick={onCheckout} style={{ background: 'green', color: 'white' }}>Checkout</button>
        <button onClick={clearCart} style={{ background: 'red', color: 'white' }}>Clear</button>
      </div>
    </div>
  );
};
