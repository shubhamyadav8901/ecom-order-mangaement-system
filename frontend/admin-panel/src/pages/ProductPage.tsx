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
  imageUrls?: string[];
  categoryId?: number | null;
  categoryName?: string | null;
}

interface Category {
  id: number;
  name: string;
}

interface NewCategoryFormData {
  name: string;
  description: string;
}

interface ProductFormData {
  name: string;
  price: string;
  description: string;
  inventory: string;
  categoryId: string;
  imageUrls: string[];
  imageUrlInput: string;
}

export const ProductPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    price: '',
    description: '',
    inventory: '100',
    categoryId: '',
    imageUrls: [],
    imageUrlInput: ''
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const { addToast } = useToast();

  const [sortField, setSortField] = useState<keyof Product | 'stock'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedImageByProduct, setSelectedImageByProduct] = useState<Record<number, number>>({});
  const [showCreateCategory, setShowCreateCategory] = useState(false);
  const [newCategoryForm, setNewCategoryForm] = useState<NewCategoryFormData>({ name: '', description: '' });

  useEffect(() => {
    loadProducts();
    loadCategories();
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

  const loadCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error(e);
      setCategories([]);
    }
  };

  const handleCreateCategory = async () => {
    const name = newCategoryForm.name.trim();
    if (!name) {
      addToast('Category name is required', 'error');
      return;
    }
    try {
      const res = await api.post('/categories', {
        name,
        description: newCategoryForm.description.trim() || null
      });
      const created = res.data as Category;
      setCategories((prev) => [...prev, created]);
      setFormData((prev) => ({ ...prev, categoryId: String(created.id) }));
      setNewCategoryForm({ name: '', description: '' });
      setShowCreateCategory(false);
      addToast('Category created', 'success');
    } catch (e) {
      console.error(e);
      addToast('Failed to create category', 'error');
    }
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

  const resetForm = () => {
    setFormData({
      name: '',
      price: '',
      description: '',
      inventory: '100',
      categoryId: '',
      imageUrls: [],
      imageUrlInput: ''
    });
    setShowCreateCategory(false);
    setNewCategoryForm({ name: '', description: '' });
  };

  const addImageUrl = () => {
    const candidate = formData.imageUrlInput.trim();
    if (!candidate) return;
    if (formData.imageUrls.includes(candidate)) {
      addToast('Image URL already added', 'info');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      imageUrls: [...prev.imageUrls, candidate],
      imageUrlInput: ''
    }));
  };

  const removeImageUrl = (url: string) => {
    setFormData((prev) => ({
      ...prev,
      imageUrls: prev.imageUrls.filter((item) => item !== url)
    }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    try {
      const fileReads = files.map((file) => new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error(`Failed to read file ${file.name}`));
        reader.readAsDataURL(file);
      }));
      const encodedImages = (await Promise.all(fileReads)).filter(Boolean);
      setFormData((prev) => ({
        ...prev,
        imageUrls: [...new Set([...prev.imageUrls, ...encodedImages])]
      }));
    } catch (error) {
      console.error(error);
      addToast('Failed to process selected image files', 'error');
    } finally {
      e.target.value = '';
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
              status: 'ACTIVE',
              categoryId: formData.categoryId ? Number(formData.categoryId) : null,
              imageUrls: formData.imageUrls
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
            status: 'ACTIVE',
            categoryId: formData.categoryId ? Number(formData.categoryId) : null,
            imageUrls: formData.imageUrls
          });
          const product = res.data;
          await api.post('/inventory/add', { productId: product.id, quantity: parsedInventory });
          addToast('Product created', 'success');
      }
      setIsModalOpen(false);
      setEditingProduct(null);
      resetForm();
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
          inventory: p.stock?.toString() || '0',
          categoryId: p.categoryId ? String(p.categoryId) : '',
          imageUrls: p.imageUrls || [],
          imageUrlInput: ''
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
    .filter(p => `${p.name} ${p.categoryName || ''}`.toLowerCase().includes(search.toLowerCase()))
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
        <Card style={{ marginBottom: 0, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Total Products</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{products.length}</div>
        </Card>
        <Card style={{ marginBottom: 0, background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
          <div style={{ fontSize: '0.75rem', color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.08em' }}>In Stock</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{products.filter((p) => (p.stock || 0) > 0).length}</div>
        </Card>
        <Card style={{ marginBottom: 0, background: '#fff7ed', border: '1px solid #fed7aa' }}>
          <div style={{ fontSize: '0.75rem', color: '#c2410c', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Low Stock (&lt; 5)</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{products.filter((p) => (p.stock || 0) > 0 && (p.stock || 0) < 5).length}</div>
        </Card>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', gap: '0.75rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', width: '300px' }}>
          <Search size={16} style={{ position: 'absolute', left: 10, top: 12, color: '#9ca3af' }} />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e: any) => setSearch(e.target.value)}
            style={{ paddingLeft: '2.5rem' }}
          />
        </div>
        <Button onClick={() => { setEditingProduct(null); resetForm(); setIsModalOpen(true); }} icon={<Plus size={16} />}>
            Add Product
        </Button>
      </div>

      <Card style={{ padding: 0, overflow: 'hidden', border: '1px solid #dbeafe' }}>
        <table className="table">
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '0.85rem 1rem', width: 96 }}>Image</th>
              <th style={{ textAlign: 'left', padding: '1rem', cursor: 'pointer' }} onClick={() => handleSort('name')}>
                  Name {renderSortIcon('name')}
              </th>
              <th style={{ textAlign: 'left', padding: '1rem' }}>Category</th>
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
                <td style={{ padding: '0.9rem 1rem' }}>
                  <div style={{ width: '60px', height: '60px', border: '1px solid #e5e7eb', borderRadius: '0.5rem', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {p.imageUrls && p.imageUrls.length > 0 ? (
                      <img
                        src={p.imageUrls[selectedImageByProduct[p.id] ?? 0] || p.imageUrls[0]}
                        alt={p.name}
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      />
                    ) : (
                      <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>No image</span>
                    )}
                  </div>
                  {p.imageUrls && p.imageUrls.length > 1 && (
                    <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.35rem', overflowX: 'auto', maxWidth: 140 }}>
                      {p.imageUrls.slice(0, 4).map((url, idx) => (
                        <button
                          key={`${p.id}-thumb-${idx}`}
                          type="button"
                          onMouseEnter={() => setSelectedImageByProduct((prev) => ({ ...prev, [p.id]: idx }))}
                          onClick={() => setSelectedImageByProduct((prev) => ({ ...prev, [p.id]: idx }))}
                          style={{
                            width: 18,
                            height: 18,
                            border: (selectedImageByProduct[p.id] ?? 0) === idx ? '2px solid #2563eb' : '1px solid #cbd5e1',
                            borderRadius: 4,
                            padding: 0,
                            overflow: 'hidden',
                            cursor: 'pointer',
                            background: '#fff',
                            flex: '0 0 auto'
                          }}
                          aria-label={`Show image ${idx + 1} for ${p.name}`}
                        >
                          <img src={url} alt={`${p.name} ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </button>
                      ))}
                    </div>
                  )}
                </td>
                <td style={{ padding: '1rem' }}>
                  <div style={{ fontWeight: 600 }}>{p.name}</div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>{p.description}</div>
                </td>
                <td style={{ padding: '1rem' }}>{p.categoryName || 'Uncategorized'}</td>
                <td style={{ padding: '1rem', fontWeight: 600 }}>${p.price.toFixed(2)}</td>
                <td style={{ padding: '1rem', fontWeight: 600 }}>{p.stock}</td>
                <td style={{ padding: '1rem' }}>
                  <Badge variant={p.status === 'ACTIVE' ? 'success' : p.status === 'INACTIVE' ? 'warning' : 'danger'}>
                    {p.status}
                  </Badge>
                </td>
                <td style={{ padding: '1rem', display: 'flex', gap: '0.5rem' }}>
                  <Button variant="ghost" onClick={() => openEdit(p)} icon={<Edit size={16} color="#2563eb" />} />
                  <Button variant="ghost" onClick={() => handleDelete(p.id)} icon={<Trash2 size={16} color="#ef4444" />} />
                </td>
              </tr>
            ))}
            {filteredProducts.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>No products found.</td></tr>}
          </tbody>
        </table>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingProduct ? "Edit Product" : "Add Product"}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Input label="Name" value={formData.name} onChange={(e: any) => setFormData({...formData, name: e.target.value})} required />
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.9rem', fontWeight: 500 }}>
            Category
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                style={{ flex: 1, height: 38, border: '1px solid #d1d5db', borderRadius: 8, padding: '0 0.6rem', background: '#fff' }}
              >
                <option value="">Uncategorized</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
              <Button type="button" variant="ghost" onClick={() => setShowCreateCategory((prev) => !prev)}>
                {showCreateCategory ? 'Close' : 'New Category'}
              </Button>
            </div>
            {showCreateCategory && (
              <div style={{ border: '1px dashed #cbd5e1', borderRadius: 8, padding: '0.75rem', marginTop: '0.35rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <Input
                  label="Category Name"
                  value={newCategoryForm.name}
                  onChange={(e: any) => setNewCategoryForm({ ...newCategoryForm, name: e.target.value })}
                  required
                />
                <Input
                  label="Category Description"
                  value={newCategoryForm.description}
                  onChange={(e: any) => setNewCategoryForm({ ...newCategoryForm, description: e.target.value })}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button type="button" onClick={handleCreateCategory}>Create Category</Button>
                </div>
              </div>
            )}
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <Input label="Price" type="number" step="0.01" min="0.01" value={formData.price} onChange={(e: any) => setFormData({...formData, price: e.target.value})} required />
          <Input label="Stock" type="number" min="0" step="1" value={formData.inventory} onChange={(e: any) => setFormData({...formData, inventory: e.target.value})} required />
          </div>
          <Input label="Description" value={formData.description} onChange={(e: any) => setFormData({...formData, description: e.target.value})} />
          <div style={{ border: '1px solid #e5e7eb', borderRadius: '0.5rem', padding: '0.75rem' }}>
            <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Product Images</div>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Input
                placeholder="https://example.com/image.jpg"
                value={formData.imageUrlInput}
                onChange={(e: any) => setFormData({ ...formData, imageUrlInput: e.target.value })}
              />
              <Button type="button" onClick={addImageUrl}>Add URL</Button>
            </div>
            <input type="file" accept="image/*" multiple onChange={handleFileUpload} />
            {formData.imageUrls.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))', gap: '0.5rem', marginTop: '0.75rem' }}>
                {formData.imageUrls.map((url) => (
                  <div key={url} style={{ position: 'relative' }}>
                    <img
                      src={url}
                      alt="Product"
                      style={{ width: '72px', height: '72px', objectFit: 'cover', borderRadius: '0.5rem', border: '1px solid #e5e7eb' }}
                    />
                    <button
                      type="button"
                      onClick={() => removeImageUrl(url)}
                      style={{ position: 'absolute', top: -6, right: -6, border: 'none', width: 18, height: 18, borderRadius: '50%', background: '#ef4444', color: '#fff', cursor: 'pointer', lineHeight: 1 }}
                      aria-label="Remove image"
                    >
                      x
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit">{editingProduct ? "Update" : "Create"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
