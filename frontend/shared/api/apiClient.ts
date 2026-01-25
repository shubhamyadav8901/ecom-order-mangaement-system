export class ApiClient {
  constructor(private tokenKey: string) {}

  private getHeaders() {
    const token = localStorage.getItem(this.tokenKey);
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    };
  }

  async fetch(url: string, options: RequestInit = {}) {
    // Merge headers carefully
    const headers = {
      ...this.getHeaders(),
      ...(options.headers as Record<string, string> || {})
    };

    try {
      const response = await fetch(url, { ...options, headers });

      if (response.status === 401) {
        localStorage.removeItem(this.tokenKey);
        window.location.href = '/'; // Force redirect to home/login
      }

      return response;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  async get(url: string) {
    return this.fetch(url, { method: 'GET' });
  }

  async post(url: string, body: any) {
    return this.fetch(url, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async put(url: string, body: any) {
    return this.fetch(url, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  async delete(url: string) {
    return this.fetch(url, { method: 'DELETE' });
  }
}
