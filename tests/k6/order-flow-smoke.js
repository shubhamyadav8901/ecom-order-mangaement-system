import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = (__ENV.BASE_URL || 'http://localhost/api').replace(/\/$/, '');
const USER_EMAIL = __ENV.USER_EMAIL || 'user@example.com';
const USER_PASSWORD = __ENV.USER_PASSWORD || 'password';

export const options = {
  vus: Number(__ENV.VUS || 5),
  duration: __ENV.DURATION || '30s',
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<1500'],
  },
};

export function setup() {
  const loginPayload = JSON.stringify({ email: USER_EMAIL, password: USER_PASSWORD });
  const loginRes = http.post(`${BASE_URL}/auth/login`, loginPayload, {
    headers: { 'Content-Type': 'application/json' },
  });

  check(loginRes, {
    'login returns 200': (r) => r.status === 200,
    'login has access token': (r) => !!r.json('accessToken'),
  });

  const accessToken = loginRes.json('accessToken');
  if (!accessToken) {
    throw new Error('Unable to login: no access token');
  }

  const productsRes = http.get(`${BASE_URL}/products`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  check(productsRes, {
    'products returns 200': (r) => r.status === 200,
  });

  const products = productsRes.json();
  if (!Array.isArray(products) || products.length === 0) {
    throw new Error('No products available for order smoke test');
  }

  const activeProduct = products.find((product) => String(product.status || '').toUpperCase() === 'ACTIVE') || products[0];
  return {
    accessToken,
    productId: activeProduct.id,
  };
}

export default function (data) {
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${data.accessToken}`,
  };

  const createOrderPayload = JSON.stringify({
    items: [
      {
        productId: data.productId,
        quantity: 1,
        price: 0,
      },
    ],
  });

  const createOrderRes = http.post(`${BASE_URL}/orders`, createOrderPayload, { headers });
  check(createOrderRes, {
    'create order returns success': (r) => r.status === 200 || r.status === 201,
    'create order has id': (r) => !!r.json('id'),
  });

  const myOrdersRes = http.get(`${BASE_URL}/orders/my-orders`, { headers });
  check(myOrdersRes, {
    'my orders returns 200': (r) => r.status === 200,
  });

  sleep(1);
}
