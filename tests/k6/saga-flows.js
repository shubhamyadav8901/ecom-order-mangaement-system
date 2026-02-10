import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Trend } from 'k6/metrics';

const BASE_URL = (__ENV.BASE_URL || 'http://localhost/api').replace(/\/$/, '');
const USER_EMAIL = __ENV.USER_EMAIL || 'user@example.com';
const USER_PASSWORD = __ENV.USER_PASSWORD || 'password';
const ADMIN_EMAIL = __ENV.ADMIN_EMAIL || 'admin@example.com';
const ADMIN_PASSWORD = __ENV.ADMIN_PASSWORD || 'password';

const checkoutFlowDuration = new Trend('checkout_flow_duration', true);
const cancelFlowDuration = new Trend('cancel_flow_duration', true);
const refundFlowDuration = new Trend('refund_flow_duration', true);
const flowErrors = new Counter('saga_flow_errors');

export const options = {
  scenarios: {
    checkout_flow: {
      executor: 'constant-vus',
      exec: 'checkoutFlow',
      vus: Number(__ENV.CHECKOUT_VUS || 2),
      duration: __ENV.CHECKOUT_DURATION || '20s',
    },
    cancel_flow: {
      executor: 'constant-vus',
      exec: 'cancelFlow',
      vus: Number(__ENV.CANCEL_VUS || 2),
      duration: __ENV.CANCEL_DURATION || '20s',
      startTime: __ENV.CANCEL_START || '2s',
    },
    refund_flow: {
      executor: 'constant-vus',
      exec: 'refundFlow',
      vus: Number(__ENV.REFUND_VUS || 1),
      duration: __ENV.REFUND_DURATION || '20s',
      startTime: __ENV.REFUND_START || '4s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.08'],
    http_req_duration: ['p(95)<1800'],
    checkout_flow_duration: ['p(95)<2000'],
    cancel_flow_duration: ['p(95)<3000'],
    refund_flow_duration: ['p(95)<7000'],
  },
};

export function setup() {
  const userToken = login(USER_EMAIL, USER_PASSWORD, 'user');
  const adminToken = login(ADMIN_EMAIL, ADMIN_PASSWORD, 'admin');
  const productId = resolveProductId(userToken);

  return { userToken, adminToken, productId };
}

export function checkoutFlow(data) {
  const start = Date.now();
  const order = createOrder(data.userToken, data.productId, 1);
  const duration = Date.now() - start;
  checkoutFlowDuration.add(duration);

  if (!order || !order.id) {
    flowErrors.add(1, { flow: 'checkout' });
  }

  sleep(0.5);
}

export function cancelFlow(data) {
  const start = Date.now();
  const order = createOrder(data.userToken, data.productId, 1);
  if (!order || !order.id) {
    flowErrors.add(1, { flow: 'cancel-create' });
    return;
  }

  const cancelRes = http.post(`${BASE_URL}/orders/${order.id}/cancel`, null, {
    headers: authHeaders(data.userToken),
  });

  const ok = check(cancelRes, {
    'cancel order returns 200': (r) => r.status === 200,
  });
  if (!ok) {
    flowErrors.add(1, { flow: 'cancel' });
  }

  cancelFlowDuration.add(Date.now() - start);
  sleep(0.5);
}

export function refundFlow(data) {
  const start = Date.now();
  const order = createOrder(data.userToken, data.productId, 1);
  if (!order || !order.id) {
    flowErrors.add(1, { flow: 'refund-create' });
    return;
  }

  const paymentRes = http.post(
    `${BASE_URL}/payments/initiate`,
    JSON.stringify({ orderId: order.id, amount: Number(order.totalAmount || 1), paymentMethod: 'CARD' }),
    {
      headers: {
        ...authHeaders(data.adminToken),
        'Content-Type': 'application/json',
      },
    }
  );

  const paymentOk = check(paymentRes, {
    'payment initiate accepted': (r) => r.status === 200,
  });
  if (!paymentOk) {
    flowErrors.add(1, { flow: 'refund-payment' });
  }

  pollOrderStatus(data.userToken, order.id, ['PAID', 'REFUND_PENDING', 'CANCELLED', 'REFUND_FAILED'], 10);

  const cancelRes = http.post(`${BASE_URL}/orders/${order.id}/cancel`, null, {
    headers: authHeaders(data.userToken),
  });
  const cancelOk = check(cancelRes, {
    'paid cancel accepted': (r) => r.status === 200 || r.status === 409,
  });
  if (!cancelOk) {
    flowErrors.add(1, { flow: 'refund-cancel' });
  }

  pollOrderStatus(data.userToken, order.id, ['REFUND_PENDING', 'CANCELLED', 'REFUND_FAILED'], 12);
  refundFlowDuration.add(Date.now() - start);

  sleep(0.5);
}

function login(email, password, label) {
  const res = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({ email, password }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  const ok = check(res, {
    [`${label} login status 200`]: (r) => r.status === 200,
    [`${label} login token present`]: (r) => !!r.json('accessToken'),
  });

  if (!ok) {
    throw new Error(`Failed ${label} login. status=${res.status} body=${res.body}`);
  }
  return res.json('accessToken');
}

function resolveProductId(userToken) {
  const res = http.get(`${BASE_URL}/products`, { headers: authHeaders(userToken) });
  const ok = check(res, {
    'products status 200': (r) => r.status === 200,
  });

  if (!ok) {
    throw new Error(`Products endpoint failed. status=${res.status} body=${res.body}`);
  }

  const products = res.json();
  if (!Array.isArray(products) || products.length === 0) {
    throw new Error('No products available for performance flows');
  }

  const active = products.find((p) => String(p.status || '').toUpperCase() === 'ACTIVE') || products[0];
  return active.id;
}

function createOrder(userToken, productId, quantity) {
  const payload = {
    items: [{ productId, quantity, price: 0 }],
  };

  const res = http.post(`${BASE_URL}/orders`, JSON.stringify(payload), {
    headers: {
      ...authHeaders(userToken),
      'Content-Type': 'application/json',
    },
  });

  const ok = check(res, {
    'create order success': (r) => r.status === 200 || r.status === 201,
    'create order has id': (r) => !!r.json('id'),
  });

  if (!ok) {
    flowErrors.add(1, { flow: 'create-order' });
    return null;
  }

  return res.json();
}

function pollOrderStatus(userToken, orderId, acceptedStatuses, maxAttempts) {
  for (let i = 0; i < maxAttempts; i += 1) {
    const res = http.get(`${BASE_URL}/orders/${orderId}`, { headers: authHeaders(userToken) });
    if (res.status === 200) {
      const status = res.json('status');
      if (acceptedStatuses.includes(status)) {
        return status;
      }
    }
    sleep(0.5);
  }
  return null;
}

function authHeaders(token) {
  return { Authorization: `Bearer ${token}` };
}
