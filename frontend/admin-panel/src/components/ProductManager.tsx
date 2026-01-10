import React, { useState, useEffect } from 'react';
import { fetchWithAuth } from '../api';

interface Product {
  id: number;
  name: string;
  price: number;
  description: string;
  sellerId: number;
}

export const ProductManager: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [inventory, setInventory] = useState('100');

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const res = await fetchWithAuth('/api/products');
      if (res.ok) {
        setProducts(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // 1. Create Product
      const productRes = await fetchWithAuth('/api/products', {
        method: 'POST',
        body: JSON.stringify({
          name,
          description,
          price: parseFloat(price),
          sellerId: 1, // Mock seller ID for now
          status: 'ACTIVE'
        })
      });

      if (!productRes.ok) {
        alert('Failed to create product');
        return;
      }

      const product = await productRes.json();

      // 2. Add Initial Stock (Inventory Service)
      await fetchWithAuth('/api/inventory/add', {
        method: 'POST',
        body: JSON.stringify({
          productId: product.id,
          quantity: parseInt(inventory)
        })
      });

      alert('Product created & stock added');
      setName(''); setPrice(''); setDescription('');
      loadProducts();
    } catch (err) {
      console.error(err);
      alert('Error creating product');
    }
  };

  return (
    <div style={{ padding: '20px', background: 'white', marginTop: '20px', borderRadius: '8px' }}>
      <h3>Product Management</h3>

      <form onSubmit={handleCreate} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <input placeholder="Name" value={name} onChange={e => setName(e.target.value)} required />
        <input placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} />
        <input placeholder="Price" type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} required />
        <input placeholder="Initial Stock" type="number" value={inventory} onChange={e => setInventory(e.target.value)} required />
        <button type="submit">Create Product</button>
      </form>

      <table border={1} cellPadding={8} style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Price</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          {products.map(p => (
            <tr key={p.id}>
              <td>{p.id}</td>
              <td>{p.name}</td>
              <td>${p.price}</td>
              <td>{p.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
