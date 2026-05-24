import { readdir, readFile, writeFile, unlink, stat } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Document, DocumentMeta } from '@focus-writer/shared';
import { STORAGE_BASE, DRAFTS_PATH, sanitizeFileName } from '../utils/storage.js';

interface DocumentMetadata {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  savedAt?: string;
}

const META_SUFFIX = '.meta.json';

export class DocumentService {
  private getDocPath(id: string): string {
    return join(STORAGE_BASE, `${id}.md`);
  }

  private getMetaPath(id: string): string {
    return join(STORAGE_BASE, `${id}${META_SUFFIX}`);
  }

  private getDraftPath(id: string): string {
    return join(DRAFTS_PATH, `${id}.draft.md`);
  }

  async createDocument(name: string): Promise<Document> {
    const id = uuidv4();
    const now = new Date().toISOString();
    const meta: DocumentMetadata = {
      id,
      name: sanitizeFileName(name || 'Untitled'),
      createdAt: now,
      updatedAt: now,
    };

    const document: Document = {
      ...meta,
      content: '',
    };

    await writeFile(this.getDocPath(id), '');
    await writeFile(this.getMetaPath(id), JSON.stringify(meta, null, 2));

    return document;
  }

  async listDocuments(): Promise<DocumentMeta[]> {
    try {
      const files = await readdir(STORAGE_BASE);
      const metaFiles = files.filter((f) => f.endsWith(META_SUFFIX));

      const docs: DocumentMeta[] = [];
      for (const file of metaFiles) {
        try {
          const content = await readFile(join(STORAGE_BASE, file), 'utf-8');
          const meta = JSON.parse(content) as DocumentMetadata;
          docs.push(meta);
        } catch (err) {
          console.error(`Failed to read meta file ${file}:`, err);
        }
      }

      // Sort by updated time, newest first
      return docs.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    } catch (err) {
      console.error('Failed to list documents:', err);
      return [];
    }
  }

  async getDocument(id: string): Promise<Document | null> {
    try {
      const [content, metaContent] = await Promise.all([
        readFile(this.getDocPath(id), 'utf-8'),
        readFile(this.getMetaPath(id), 'utf-8'),
      ]);

      const meta = JSON.parse(metaContent) as DocumentMetadata;
      return {
        ...meta,
        content,
      };
    } catch (err) {
      console.error(`Failed to get document ${id}:`, err);
      return null;
    }
  }

  async saveDocument(id: string, content: string): Promise<boolean> {
    try {
      const doc = await this.getDocument(id);
      if (!doc) return false;

      const now = new Date().toISOString();
      const meta: DocumentMetadata = {
        ...doc,
        updatedAt: now,
        savedAt: now,
      };

      await writeFile(this.getDocPath(id), content);
      await writeFile(this.getMetaPath(id), JSON.stringify(meta, null, 2));

      // Clear draft
      try {
        await unlink(this.getDraftPath(id));
      } catch {
        // Draft may not exist
      }

      return true;
    } catch (err) {
      console.error(`Failed to save document ${id}:`, err);
      return false;
    }
  }

  async autosaveDraft(id: string, content: string): Promise<boolean> {
    try {
      await writeFile(this.getDraftPath(id), content);
      return true;
    } catch (err) {
      console.error(`Failed to autosave draft for ${id}:`, err);
      return false;
    }
  }

  async getDraft(id: string): Promise<string | null> {
    try {
      return await readFile(this.getDraftPath(id), 'utf-8');
    } catch {
      return null;
    }
  }

  async deleteDraft(id: string): Promise<void> {
    try {
      await unlink(this.getDraftPath(id));
    } catch {
      // Draft may not exist
    }
  }

  async deleteDocument(id: string): Promise<boolean> {
    try {
      await Promise.all([unlink(this.getDocPath(id)), unlink(this.getMetaPath(id))]);
      await this.deleteDraft(id);
      return true;
    } catch (err) {
      console.error(`Failed to delete document ${id}:`, err);
      return false;
    }
  }
}

export const documentService = new DocumentService();
