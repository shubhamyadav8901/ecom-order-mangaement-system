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
  const [showForm, setShowForm] = useState(false);

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
      setShowForm(false);
      loadProducts();
    } catch (err) {
      console.error(err);
      alert('Error creating product');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3>Product Management</h3>
        <button className="btn" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'Add New Product'}
        </button>
      </div>

      {showForm && (
        <div className="card">
          <h4 style={{ marginBottom: '1rem' }}>Create Product</h4>
          <form onSubmit={handleCreate}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Name</label>
                <input className="input" placeholder="Product Name" value={name} onChange={e => setName(e.target.value)} required />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Price</label>
                <input className="input" placeholder="Price" type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} required />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Description</label>
                <input className="input" placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Initial Stock</label>
                <input className="input" placeholder="Quantity" type="number" value={inventory} onChange={e => setInventory(e.target.value)} required />
              </div>
            </div>
            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn" type="submit">Save Product</button>
            </div>
          </form>
        </div>
      )}

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Price</th>
              <th>Description</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p.id}>
                <td>{p.id}</td>
                <td>{p.name}</td>
                <td>${p.price.toFixed(2)}</td>
                <td>{p.description}</td>
                <td><span style={{ padding: '0.25rem 0.5rem', borderRadius: '9999px', fontSize: '0.75rem', backgroundColor: '#d1fae5', color: '#065f46' }}>Active</span></td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No products found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
