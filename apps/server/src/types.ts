export interface Document {
  id: string;
  name: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  savedAt?: string;
}

export interface DocumentMeta {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  savedAt?: string;
}

export interface AppSettings {
  affineSyncPath?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ExportOptions {
  format: 'md' | 'odt';
  title?: string;
}
