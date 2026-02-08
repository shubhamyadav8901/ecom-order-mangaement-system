import React, { useState, useEffect } from 'react';
import { Card } from '@shared/ui/Card';
import { Button } from '@shared/ui/Button';
import { Input } from '@shared/ui/Input';
import { Modal } from '@shared/ui/Modal';
import { Badge } from '@shared/ui/Badge';
import { useToast } from '@shared/ui/Toast';
import { api } from '../api';
import { Plus, Trash2, Search, Edit, ArrowUpDown } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  price: number;
  description: string;
  status: string;
  stock?: number;
}

export const ProductPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({ name: '', price: '', description: '', inventory: '100' });
  const { addToast } = useToast();

  const [sortField, setSortField] = useState<keyof Product | 'stock'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const res = await api.get('/products');
      const productList = res.data;
      const ids = productList.map((p: any) => p.id);
      if (ids.length > 0) {
          try {
             const invRes = await api.post('/inventory/batch', ids);
             const stockMap = invRes.data;
             setProducts(productList.map((p: any) => ({ ...p, stock: stockMap[p.id] || 0 })));
          } catch {
             setProducts(productList);
          }
      } else {
          setProducts([]);
      }
    } catch(e) { console.error(e); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this product?')) return;
    try {
      await api.delete(`/products/${id}`);
      setProducts(prev => prev.filter(p => p.id !== id));
      addToast('Product deleted', 'success');
    } catch (_e) {
        addToast('Failed to delete product', 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedPrice = Number(formData.price);
    const parsedInventory = Number(formData.inventory);

    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      addToast('Price must be a valid number greater than 0', 'error');
      return;
    }

    if (!Number.isInteger(parsedInventory) || parsedInventory < 0) {
      addToast('Stock must be a whole number >= 0', 'error');
      return;
    }

    try {
      if (editingProduct) {
          // Edit
          await api.put(`/products/${editingProduct.id}`, {
              name: formData.name,
              description: formData.description,
              price: parsedPrice,
              status: 'ACTIVE'
          });
          // Update inventory
          await api.post('/inventory/set', {
              productId: editingProduct.id,
              quantity: parsedInventory
          });
          addToast('Product updated', 'success');
      } else {
          // Create
          const res = await api.post('/products', {
            name: formData.name,
            description: formData.description,
            price: parsedPrice,
            sellerId: 1, // Mock
            status: 'ACTIVE'
          });
          const product = res.data;
          await api.post('/inventory/add', { productId: product.id, quantity: parsedInventory });
          addToast('Product created', 'success');
      }
      setIsModalOpen(false);
      setEditingProduct(null);
      setFormData({ name: '', price: '', description: '', inventory: '100' });
      loadProducts();
    } catch(e) {
        console.error(e);
        addToast('Operation failed', 'error');
    }
  };

  const openEdit = (p: Product) => {
      setEditingProduct(p);
      setFormData({
          name: p.name,
          price: p.price.toString(),
          description: p.description,
          inventory: p.stock?.toString() || '0'
      });
      setIsModalOpen(true);
  };

  const handleSort = (field: keyof Product | 'stock') => {
      if (sortField === field) {
          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
      } else {
          setSortField(field);
          setSortOrder('asc');
      }
  };

  const filteredProducts = products
    .filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
        const valA = a[sortField] ?? '';
        const valB = b[sortField] ?? '';

        if (typeof valA === 'string' && typeof valB === 'string') {
            return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        if (typeof valA === 'number' && typeof valB === 'number') {
            return sortOrder === 'asc' ? valA - valB : valB - valA;
        }
        return 0;
    });

  const renderSortIcon = (field: string) => {
      if (sortField !== field) return <ArrowUpDown size={14} style={{ opacity: 0.3, marginLeft: 4 }} />;
      return <ArrowUpDown size={14} style={{ marginLeft: 4, transform: sortOrder === 'desc' ? 'rotate(180deg)' : 'none' }} />;
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div style={{ position: 'relative', width: '300px' }}>
          <Search size={16} style={{ position: 'absolute', left: 10, top: 12, color: '#9ca3af' }} />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e: any) => setSearch(e.target.value)}
            style={{ paddingLeft: '2.5rem' }}
          />
        </div>
        <Button onClick={() => { setEditingProduct(null); setFormData({ name: '', price: '', description: '', inventory: '100' }); setIsModalOpen(true); }} icon={<Plus size={16} />}>
            Add Product
        </Button>
      </div>

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <table className="table">
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '1rem', cursor: 'pointer' }} onClick={() => handleSort('name')}>
                  Name {renderSortIcon('name')}
              </th>
              <th style={{ textAlign: 'left', padding: '1rem', cursor: 'pointer' }} onClick={() => handleSort('price')}>
                  Price {renderSortIcon('price')}
              </th>
              <th style={{ textAlign: 'left', padding: '1rem', cursor: 'pointer' }} onClick={() => handleSort('stock')}>
                  Stock {renderSortIcon('stock')}
              </th>
              <th style={{ textAlign: 'left', padding: '1rem', cursor: 'pointer' }} onClick={() => handleSort('status')}>
                  Status {renderSortIcon('status')}
              </th>
              <th style={{ textAlign: 'left', padding: '1rem' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map(p => (
              <tr key={p.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                <td style={{ padding: '1rem' }}>
                  <div style={{ fontWeight: 500 }}>{p.name}</div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>{p.description}</div>
                </td>
                <td style={{ padding: '1rem' }}>${p.price.toFixed(2)}</td>
                <td style={{ padding: '1rem' }}>{p.stock}</td>
                <td style={{ padding: '1rem' }}><Badge variant="success">Active</Badge></td>
                <td style={{ padding: '1rem', display: 'flex', gap: '0.5rem' }}>
                  <Button variant="ghost" onClick={() => openEdit(p)} icon={<Edit size={16} color="#2563eb" />} />
                  <Button variant="ghost" onClick={() => handleDelete(p.id)} icon={<Trash2 size={16} color="#ef4444" />} />
                </td>
              </tr>
            ))}
            {filteredProducts.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>No products found.</td></tr>}
          </tbody>
        </table>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingProduct ? "Edit Product" : "Add Product"}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Input label="Name" value={formData.name} onChange={(e: any) => setFormData({...formData, name: e.target.value})} required />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <Input label="Price" type="number" step="0.01" min="0.01" value={formData.price} onChange={(e: any) => setFormData({...formData, price: e.target.value})} required />
          <Input label="Stock" type="number" min="0" step="1" value={formData.inventory} onChange={(e: any) => setFormData({...formData, inventory: e.target.value})} required />
          </div>
          <Input label="Description" value={formData.description} onChange={(e: any) => setFormData({...formData, description: e.target.value})} />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit">{editingProduct ? "Update" : "Create"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
