import React, { useState, useEffect } from 'react';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  };
};

const fetchApi = async (url: string, options: RequestInit = {}) => {
  const headers = { ...getHeaders(), ...options.headers };
  const response = await fetch(url, { ...options, headers });
  if (response.status === 401) {
    localStorage.removeItem('token');
    window.location.reload();
  }
  return response;
};

interface Product {
  id: number;
  name: string;
  price: number;
  description: string;
}

interface ProductCatalogProps {
  addToCart: (product: Product) => void;
}

export const ProductCatalog: React.FC<ProductCatalogProps> = ({ addToCart }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    fetchApi('/api/products')
      .then(res => res.json())
      .then(data => setProducts(data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
      {products.map(p => (
        <div key={p.id} style={{ border: '1px solid #ccc', padding: '10px', borderRadius: '8px' }}>
          <h4>{p.name}</h4>
          <p>{p.description}</p>
          <p><strong>${p.price}</strong></p>
          <button onClick={() => addToCart(p)}>Add to Cart</button>
        </div>
      ))}
    </div>
  );
};
