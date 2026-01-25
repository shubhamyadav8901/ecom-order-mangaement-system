import React, { useState, useEffect } from 'react';
import { Card } from '@shared/ui/Card';
import { Button } from '@shared/ui/Button';
import { Input } from '@shared/ui/Input';
import { Modal } from '@shared/ui/Modal';
import { Badge } from '@shared/ui/Badge';
import { fetchWithAuth } from '../api';
import { Plus, Trash2, Search } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  price: number;
  description: string;
  status: string;
}

export const ProductPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loading, setLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({ name: '', price: '', description: '', inventory: '100' });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth('/api/products');
      if (res.ok) setProducts(await res.json());
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this product?')) return;
    try {
      const res = await fetchWithAuth(`/api/products/${id}`, { method: 'DELETE' });
      if (res.ok) setProducts(prev => prev.filter(p => p.id !== id));
    } catch(e) { console.error(e); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetchWithAuth('/api/products', {
        method: 'POST',
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          price: parseFloat(formData.price),
          sellerId: 1, // Mock
          status: 'ACTIVE'
        })
      });
      if(res.ok) {
        const product = await res.json();
        // Add stock
        await fetchWithAuth('/api/inventory/add', {
           method: 'POST',
           body: JSON.stringify({ productId: product.id, quantity: parseInt(formData.inventory) })
        });
        setIsModalOpen(false);
        setFormData({ name: '', price: '', description: '', inventory: '100' });
        loadProducts();
      }
    } catch(e) { console.error(e); }
  };

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div style={{ position: 'relative', width: '300px' }}>
          <Search size={16} style={{ position: 'absolute', left: 10, top: 12, color: '#9ca3af' }} />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: '2.5rem' }}
          />
        </div>
        <Button onClick={() => setIsModalOpen(true)} icon={<Plus size={16} />}>Add Product</Button>
      </div>

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Price</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map(p => (
              <tr key={p.id}>
                <td>
                  <div style={{ fontWeight: 500 }}>{p.name}</div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>{p.description}</div>
                </td>
                <td>${p.price.toFixed(2)}</td>
                <td><Badge variant="success">Active</Badge></td>
                <td>
                  <Button variant="ghost" onClick={() => handleDelete(p.id)} icon={<Trash2 size={16} color="#ef4444" />} />
                </td>
              </tr>
            ))}
            {filteredProducts.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', padding: '2rem' }}>No products found.</td></tr>}
          </tbody>
        </table>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Product">
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Input label="Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Input label="Price" type="number" step="0.01" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} required />
            <Input label="Stock" type="number" value={formData.inventory} onChange={e => setFormData({...formData, inventory: e.target.value})} required />
          </div>
          <Input label="Description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit">Create Product</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
