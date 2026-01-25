import React, { useEffect, useState } from 'react';
import { fetchWithAuth } from '../api';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
}

interface Props {
  onAddToCart: () => void;
}

export const ProductCatalog: React.FC<Props> = ({ onAddToCart }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    fetchWithAuth('/api/products')
      .then(res => res.json())
      .then(data => setProducts(data))
      .catch(err => console.error(err));
  }, []);

  const addToCart = (product: Product) => {
    // In a real app, we'd add to context/backend
    console.log('Added', product);
    onAddToCart();
  };

  return (
    <div>
      <h2 className="section-title">Featured Products</h2>
      <div className="product-grid">
        {products.map(p => (
          <div key={p.id} className="product-card">
            <div className="product-image-placeholder">
              {/* SVG Placeholder Icon */}
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
              </svg>
            </div>
            <div className="product-info">
              <h3 className="product-title">{p.name}</h3>
              <p className="product-desc">{p.description}</p>
              <div className="product-footer">
                <span className="product-price">${p.price.toFixed(2)}</span>
                <button className="btn btn-accent" onClick={() => addToCart(p)}>Add to Cart</button>
              </div>
            </div>
          </div>
        ))}
        {products.length === 0 && <p style={{ textAlign: 'center', gridColumn: '1/-1', color: 'var(--text-light)' }}>Loading products...</p>}
      </div>
    </div>
  );
};
