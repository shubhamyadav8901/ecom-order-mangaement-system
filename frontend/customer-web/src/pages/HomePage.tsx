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
}

interface HomePageProps {
  onAddToCart: (product: Product) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onAddToCart }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

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
      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #4f46e5 0%, #2563eb 100%)',
        borderRadius: '1rem',
        padding: '4rem 2rem',
        textAlign: 'center',
        color: 'white',
        marginBottom: '3rem',
        boxShadow: '0 10px 15px -3px rgba(37,99,235,0.3)'
      }}>
        <h1 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '1rem', letterSpacing: '-0.025em' }}>
           Summer Collection 2026
        </h1>
        <p style={{ fontSize: '1.25rem', opacity: 0.9, maxWidth: '600px', margin: '0 auto' }}>
          Discover the latest trends in high-quality apparel. Premium materials, sustainable sourcing.
        </p>
      </div>

      <h2 style={{ fontSize: '1.875rem', fontWeight: 700, marginBottom: '1.5rem', color: '#111827' }}>Featured Products</h2>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem' }}>Loading products...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '2rem' }}>
          {products.map(p => (
            <Card key={p.id} style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 0, overflow: 'hidden', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <div style={{ height: '200px', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                 <ShoppingBag size={48} color="#d1d5db" />
              </div>
              <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem' }}>{p.name}</h3>
                <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1rem', flex: 1 }}>{p.description}</p>
                <div style={{ marginBottom: '0.5rem' }}>
                    {(p.stock === undefined || p.stock === 0) ? (
                        <span style={{ color: '#ef4444', fontWeight: 600, fontSize: '0.875rem' }}>Out of Stock</span>
                    ) : (
                        <span style={{ color: '#059669', fontSize: '0.875rem' }}>{p.stock} in stock</span>
                    )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                  <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827' }}>${p.price.toFixed(2)}</span>
                  <Button onClick={() => onAddToCart(p)} disabled={!p.stock || p.stock === 0} icon={<ShoppingBag size={16} />}>
                    {(!p.stock || p.stock === 0) ? 'Sold Out' : 'Add'}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
