import React, { useEffect, useState } from 'react';
import { Card } from '@shared/ui/Card';
import { Button } from '@shared/ui/Button';
import { api } from '../api';
import { ShoppingBag } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock?: number;
  imageUrls?: string[];
  categoryId?: number | null;
  categoryName?: string | null;
}

interface Category {
  id: number;
  name: string;
}

interface HomePageProps {
  onAddToCart: (product: Product, quantity?: number) => void;
  cartQuantities: Record<number, number>;
  selectedCategoryId: number | 'all';
  onSelectCategory: (categoryId: number | 'all') => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onAddToCart,
  cartQuantities,
  selectedCategoryId,
  onSelectCategory
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedImageByProduct, setSelectedImageByProduct] = useState<Record<number, number>>({});
  const [addQtyByProduct, setAddQtyByProduct] = useState<Record<number, number>>({});
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    setLoading(true);
    const fetchData = async () => {
        try {
            const res = await api.get('/products');
            const productList: Product[] = res.data;

            // Fetch inventory
            const ids = productList.map(p => p.id);
            if (ids.length > 0) {
                try {
                    const invRes = await api.post('/inventory/batch', ids);
                    const stockMap = invRes.data;
                    const merged = productList.map(p => ({
                        ...p,
                        stock: stockMap[p.id] || 0
                    }));
                    setProducts(merged);
                } catch (invErr) {
                    console.error("Inventory fetch failed", invErr);
                    setProducts(productList);
                }
            } else {
                setProducts([]);
            }
            const categoryRes = await api.get('/categories');
            setCategories(Array.isArray(categoryRes.data) ? categoryRes.data : []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };
    fetchData();
  }, []);

  return (
    <div>
      <div style={{
        background: 'linear-gradient(90deg, #fff7e6 0%, #ffe7ba 100%)',
        border: '1px solid #fcd34d',
        borderRadius: '0.75rem',
        padding: '1rem 1.25rem',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        flexWrap: 'wrap'
      }}>
        <div>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#b45309', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Today&apos;s Deals
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#7c2d12' }}>Up to 40% off on selected items</div>
        </div>
        <span style={{ fontSize: '0.85rem', color: '#92400e' }}>Limited time offer</span>
      </div>

      <h2 style={{ fontSize: '1.875rem', fontWeight: 800, marginBottom: '1rem', color: '#111827' }}>Featured Products</h2>
      <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', marginBottom: '0.9rem' }}>
        <button
          type="button"
          onClick={() => onSelectCategory('all')}
          style={{
            border: selectedCategoryId === 'all' ? '1px solid #111827' : '1px solid #cbd5e1',
            background: selectedCategoryId === 'all' ? '#111827' : '#fff',
            color: selectedCategoryId === 'all' ? '#fff' : '#334155',
            borderRadius: 999,
            padding: '0.28rem 0.7rem',
            fontSize: '0.78rem',
            cursor: 'pointer'
          }}
        >
          All
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => onSelectCategory(category.id)}
            style={{
              border: selectedCategoryId === category.id ? '1px solid #111827' : '1px solid #cbd5e1',
              background: selectedCategoryId === category.id ? '#111827' : '#fff',
              color: selectedCategoryId === category.id ? '#fff' : '#334155',
              borderRadius: 999,
              padding: '0.28rem 0.7rem',
              fontSize: '0.78rem',
              cursor: 'pointer'
            }}
          >
            {category.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem' }}>Loading products...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
          {products
            .filter((p) => selectedCategoryId === 'all' || p.categoryId === selectedCategoryId)
            .map(p => {
            const totalStock = p.stock ?? 0;
            const inCart = cartQuantities[p.id] ?? 0;
            const availableStock = Math.max(0, totalStock - inCart);
            const desiredQty = addQtyByProduct[p.id] ?? 1;
            const clampedDesiredQty = Math.max(1, Math.min(desiredQty, Math.max(1, availableStock)));

            return (
            <Card key={p.id} style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 0, overflow: 'hidden', border: '1px solid #e5e7eb', boxShadow: 'none' }}>
              <div style={{ height: '220px', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                 {p.imageUrls && p.imageUrls.length > 0 ? (
                   <img
                     src={p.imageUrls[selectedImageByProduct[p.id] ?? 0] || p.imageUrls[0]}
                     alt={p.name}
                     style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                   />
                 ) : (
                   <ShoppingBag size={48} color="#d1d5db" />
                 )}
              </div>
              <div style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                {p.imageUrls && p.imageUrls.length > 1 && (
                  <div style={{ display: 'flex', gap: '0.35rem', marginBottom: '0.6rem', overflowX: 'auto' }}>
                    {p.imageUrls.slice(0, 5).map((url, idx) => (
                      <button
                        key={`${p.id}-${idx}`}
                        type="button"
                        onMouseEnter={() => setSelectedImageByProduct((prev) => ({ ...prev, [p.id]: idx }))}
                        onClick={() => setSelectedImageByProduct((prev) => ({ ...prev, [p.id]: idx }))}
                        style={{
                          border: (selectedImageByProduct[p.id] ?? 0) === idx ? '2px solid #2563eb' : '1px solid #d1d5db',
                          borderRadius: '0.35rem',
                          padding: 0,
                          background: '#fff',
                          width: 34,
                          height: 34,
                          overflow: 'hidden',
                          cursor: 'pointer',
                          flex: '0 0 auto'
                        }}
                        aria-label={`Show image ${idx + 1} for ${p.name}`}
                      >
                        <img src={url} alt={`${p.name} ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </button>
                    ))}
                  </div>
                )}
                <h3 style={{ fontSize: '1rem', lineHeight: 1.4, fontWeight: 600, marginBottom: '0.35rem' }}>{p.name}</h3>
                <div style={{ fontSize: '0.73rem', color: '#475569', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {p.categoryName || 'Uncategorized'}
                </div>
                <p style={{ color: '#6b7280', fontSize: '0.82rem', marginBottom: '0.75rem', minHeight: '2.3rem' }}>{p.description}</p>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.74rem', padding: '0.18rem 0.4rem', borderRadius: '0.3rem', background: '#ef4444', color: '#fff', fontWeight: 700 }}>Deal</span>
                  <span style={{ fontSize: '0.76rem', color: '#6b7280' }}>Best price today</span>
                </div>
                <div style={{ marginBottom: '0.5rem' }}>
                    {(totalStock === 0) ? (
                        <span style={{ color: '#ef4444', fontWeight: 600, fontSize: '0.875rem' }}>Out of Stock</span>
                    ) : availableStock === 0 ? (
                        <span style={{ color: '#b45309', fontWeight: 600, fontSize: '0.875rem' }}>All in cart ({inCart})</span>
                    ) : (
                        <span style={{ color: '#059669', fontSize: '0.875rem' }}>{availableStock} available ({inCart} in cart)</span>
                    )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.55rem' }}>
                  <button
                    type="button"
                    onClick={() => setAddQtyByProduct((prev) => ({ ...prev, [p.id]: Math.max(1, clampedDesiredQty - 1) }))}
                    disabled={availableStock === 0}
                    style={{ width: 28, height: 28, border: '1px solid #cbd5e1', borderRadius: 6, background: '#fff', cursor: 'pointer' }}
                    aria-label={`Decrease quantity for ${p.name}`}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min={1}
                    max={Math.max(1, availableStock)}
                    value={clampedDesiredQty}
                    disabled={availableStock === 0}
                    onChange={(e) => {
                      const next = Number(e.target.value);
                      if (!Number.isFinite(next)) return;
                      setAddQtyByProduct((prev) => ({
                        ...prev,
                        [p.id]: Math.max(1, Math.min(Math.floor(next), Math.max(1, availableStock)))
                      }));
                    }}
                    style={{ width: 56, height: 28, border: '1px solid #cbd5e1', borderRadius: 6, textAlign: 'center' }}
                  />
                  <button
                    type="button"
                    onClick={() => setAddQtyByProduct((prev) => ({ ...prev, [p.id]: Math.min(Math.max(1, availableStock), clampedDesiredQty + 1) }))}
                    disabled={availableStock === 0}
                    style={{ width: 28, height: 28, border: '1px solid #cbd5e1', borderRadius: 6, background: '#fff', cursor: 'pointer' }}
                    aria-label={`Increase quantity for ${p.name}`}
                  >
                    +
                  </button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.55rem', fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>${p.price.toFixed(2)}</span>
                  <Button
                    onClick={() => onAddToCart(p, clampedDesiredQty)}
                    disabled={availableStock === 0}
                    icon={<ShoppingBag size={14} />}
                    style={{
                      background: '#facc15',
                      color: '#111827',
                      border: '1px solid #f59e0b',
                      minWidth: '96px',
                      justifyContent: 'center'
                    }}
                  >
                    {availableStock === 0 ? 'Sold Out' : `Add ${clampedDesiredQty}`}
                  </Button>
                </div>
              </div>
            </Card>
          )})}
        </div>
      )}
    </div>
  );
};
