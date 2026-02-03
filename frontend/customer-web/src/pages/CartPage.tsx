import React from 'react';
import { Card } from '@shared/ui/Card';
import { Button } from '@shared/ui/Button';
import { Trash2 } from 'lucide-react';

interface CartItem {
  product: any;
  quantity: number;
}

interface CartPageProps {
  items: CartItem[];
  onRemove: (id: number) => void;
  onUpdateQuantity: (id: number, qty: number) => void;
  onClear: () => void;
  onCheckout: () => void;
}

export const CartPage: React.FC<CartPageProps> = ({ items, onRemove, onUpdateQuantity, onClear, onCheckout }) => {
  const total = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  if (items.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 0' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem' }}>Your cart is empty</h2>
        <p style={{ color: '#6b7280' }}>Looks like you haven't added anything to your cart yet.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
      <div style={{ flex: 2 }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1.5rem' }}>Shopping Cart</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {items.map(item => (
            <Card key={item.product.id} style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '1.5rem' }}>
               <div style={{ width: '80px', height: '80px', background: '#f3f4f6', borderRadius: '0.5rem' }} />
               <div style={{ flex: 1 }}>
                 <h4 style={{ fontWeight: 600 }}>{item.product.name}</h4>
                 <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>${item.product.price.toFixed(2)}</p>
               </div>
               <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <button
                        onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        style={{ padding: '0.25rem 0.5rem', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer', background: 'white' }}
                      >-</button>
                      <span style={{ fontWeight: 500, minWidth: '1.5rem', textAlign: 'center' }}>{item.quantity}</span>
                      <button
                        onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                        disabled={item.quantity >= (item.product.stock || 999)}
                        style={{ padding: '0.25rem 0.5rem', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer', background: 'white' }}
                      >+</button>
                  </div>
                  {item.product.stock !== undefined && item.quantity >= item.product.stock && (
                     <span style={{ fontSize: '0.75rem', color: '#ef4444' }}>Max</span>
                  )}
                  <button onClick={() => onRemove(item.product.id)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', marginLeft: '1rem' }}>
                    <Trash2 size={20} />
                  </button>
               </div>
            </Card>
          ))}
        </div>
      </div>

      <div style={{ flex: 1 }}>
        <Card style={{ position: 'sticky', top: '100px' }}>
           <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem' }}>Order Summary</h3>
           <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #e5e7eb' }}>
             <span style={{ color: '#6b7280' }}>Subtotal</span>
             <span style={{ fontWeight: 600 }}>${total.toFixed(2)}</span>
           </div>
           <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
             <span style={{ fontSize: '1.125rem', fontWeight: 700 }}>Total</span>
             <span style={{ fontSize: '1.125rem', fontWeight: 700 }}>${total.toFixed(2)}</span>
           </div>
           <Button style={{ width: '100%' }} onClick={onCheckout}>Checkout</Button>
           <Button variant="ghost" style={{ width: '100%', marginTop: '0.5rem' }} onClick={onClear}>Clear Cart</Button>
        </Card>
      </div>
    </div>
  );
};
