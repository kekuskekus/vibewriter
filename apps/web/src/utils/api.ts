import { ApiResponse, Document, DocumentMeta } from '@focus-writer/shared';

class ApiClient {
  private baseUrl = '/api';
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  hasToken(): boolean {
    return !!this.token;
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  async request<T>(
    method: string,
    path: string,
    body?: any
  ): Promise<{ success: boolean; data?: T; error?: string }> {
    try {
      const options: RequestInit = {
        method,
        headers: this.getHeaders(),
      };

      if (body) {
        options.body = JSON.stringify(body);
      }

      const response = await fetch(`${this.baseUrl}${path}`, options);

      if (response.status === 401) {
        // Token invalid or expired
        this.clearToken();
        throw new Error('Authentication failed. Please log in again.');
      }

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || `HTTP ${response.status}`,
        };
      }

      return data;
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Request failed',
      };
    }
  }

  // Documents API
  async listDocuments(): Promise<DocumentMeta[]> {
    const result = await this.request<DocumentMeta[]>('GET', '/documents');
    return result.data || [];
  }

  async createDocument(name?: string): Promise<Document | null> {
    const result = await this.request<Document>('POST', '/documents', { name });
    return result.data || null;
  }

  async getDocument(id: string): Promise<(Document & { hasDraft: boolean }) | null> {
    const result = await this.request<Document & { hasDraft: boolean }>('GET', `/documents/${id}`);
    return result.data || null;
  }

  async saveDocument(id: string, content: string): Promise<boolean> {
    const result = await this.request('PUT', `/documents/${id}`, { content });
    return result.success;
  }

  async autosaveDraft(id: string, content: string): Promise<boolean> {
    const result = await this.request('POST', `/documents/${id}/autosave`, { content });
    return result.success;
  }

  async getDraft(id: string): Promise<{ hasDraft: boolean; content: string } | null> {
    const result = await this.request<{ hasDraft: boolean; content: string }>(
      'GET',
      `/documents/${id}/draft`
    );
    return result.data || null;
  }

  async exportAsMd(id: string): Promise<Blob | null> {
    try {
      const headers = this.getHeaders();
      const response = await fetch(`${this.baseUrl}/documents/${id}/export/md`, {
        method: 'POST',
        headers,
      });

      if (!response.ok) {
        return null;
      }

      return await response.blob();
    } catch {
      return null;
    }
  }

  async exportAsOdt(id: string): Promise<Blob | null> {
    try {
      const headers = this.getHeaders();
      const response = await fetch(`${this.baseUrl}/documents/${id}/export/odt`, {
        method: 'POST',
        headers,
      });

      if (!response.ok) {
        return null;
      }

      return await response.blob();
    } catch {
      return null;
    }
  }

  async syncToAffine(id: string): Promise<boolean> {
    const result = await this.request('POST', `/documents/${id}/sync/affine`, {});
    return result.success;
  }

  // Health check
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }
}

export const apiClient = new ApiClient();
