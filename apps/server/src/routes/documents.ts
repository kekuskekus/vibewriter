import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { documentService } from '../services/documentService.js';
import { exportService } from '../services/exportService.js';
import { readFile } from 'fs/promises';

interface CreateDocumentRequest {
  name?: string;
}

interface SaveDocumentRequest {
  content: string;
}

interface ExportRequest {
  format: 'md' | 'odt';
}

export async function documentRoutes(app: FastifyInstance) {
  // GET /api/documents - List all documents
  app.get<{ Reply: any }>('/api/documents', async (request, reply) => {
    const docs = await documentService.listDocuments();
    return { success: true, data: docs };
  });

  // POST /api/documents - Create new document
  app.post<{ Body: CreateDocumentRequest; Reply: any }>('/api/documents', async (request, reply) => {
    const { name } = request.body;
    const doc = await documentService.createDocument(name || 'Untitled');
    return { success: true, data: doc };
  });

  // GET /api/documents/:id - Get document with content
  app.get<{ Params: { id: string }; Reply: any }>('/api/documents/:id', async (request, reply) => {
    const { id } = request.params;
    const doc = await documentService.getDocument(id);

    if (!doc) {
      reply.status(404).send({ success: false, error: 'Document not found' });
      return;
    }

    // Check for unsaved draft
    const draft = await documentService.getDraft(id);
    return {
      success: true,
      data: {
        ...doc,
        hasDraft: !!draft,
      },
    };
  });

  // PUT /api/documents/:id - Save document
  app.put<{ Params: { id: string }; Body: SaveDocumentRequest; Reply: any }>(
    '/api/documents/:id',
    async (request, reply) => {
      const { id } = request.params;
      const { content } = request.body;

      const success = await documentService.saveDocument(id, content);

      if (!success) {
        reply.status(404).send({ success: false, error: 'Document not found' });
        return;
      }

      return { success: true, data: { id } };
    }
  );

  // POST /api/documents/:id/autosave - Autosave draft
  app.post<{ Params: { id: string }; Body: SaveDocumentRequest; Reply: any }>(
    '/api/documents/:id/autosave',
    async (request, reply) => {
      const { id } = request.params;
      const { content } = request.body;

      const success = await documentService.autosaveDraft(id, content);

      if (!success) {
        reply.status(500).send({ success: false, error: 'Failed to autosave' });
        return;
      }

      return { success: true };
    }
  );

  // GET /api/documents/:id/draft - Get unsaved draft if exists
  app.get<{ Params: { id: string }; Reply: any }>('/api/documents/:id/draft', async (request, reply) => {
    const { id } = request.params;
    const draft = await documentService.getDraft(id);

    return {
      success: true,
      data: {
        hasDraft: !!draft,
        content: draft || '',
      },
    };
  });

  // POST /api/documents/:id/export/md - Export as Markdown
  app.post<{ Params: { id: string }; Reply: any }>('/api/documents/:id/export/md', async (request, reply) => {
    const { id } = request.params;
    const doc = await documentService.getDocument(id);

    if (!doc) {
      reply.status(404).send({ success: false, error: 'Document not found' });
      return;
    }

    const result = await exportService.exportAsMarkdown(doc.name, doc.content, {
      title: doc.name,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });

    const fileContent = await readFile(result.path);
    reply.type('text/markdown').send(fileContent);
  });

  // POST /api/documents/:id/export/odt - Export as ODT
  app.post<{ Params: { id: string }; Reply: any }>('/api/documents/:id/export/odt', async (request, reply) => {
    const { id } = request.params;
    const doc = await documentService.getDocument(id);

    if (!doc) {
      reply.status(404).send({ success: false, error: 'Document not found' });
      return;
    }

    try {
      const result = await exportService.exportAsOdt(doc.name, doc.content, {
        title: doc.name,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      });

      const fileContent = await readFile(result.path);
      reply.type('application/vnd.oasis.opendocument.text').download(result.filename).send(fileContent);
    } catch (err) {
      console.error('Failed to export ODT:', err);
      reply.status(500).send({ success: false, error: 'Failed to export as ODT' });
    }
  });
}
