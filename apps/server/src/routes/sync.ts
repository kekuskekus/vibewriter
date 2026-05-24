import { FastifyInstance } from 'fastify';
import { documentService } from '../services/documentService.js';
import { exportService } from '../services/exportService.js';
import { readFile } from 'fs/promises';
import { AFFINE_SYNC_PATH } from '../utils/storage.js';

interface SyncRequest {
  documentIds?: string[];
}

export async function syncRoutes(app: FastifyInstance) {
  // POST /api/documents/:id/sync/affine - Sync document to AFFiNE folder
  app.post<{ Params: { id: string }; Body: SyncRequest; Reply: any }>(
    '/api/documents/:id/sync/affine',
    async (request, reply) => {
      const { id } = request.params;
      const doc = await documentService.getDocument(id);

      if (!doc) {
        reply.status(404).send({ success: false, error: 'Document not found' });
        return;
      }

      try {
        // Export to AFFiNE sync folder as Markdown
        const result = await exportService.exportAsMarkdown(doc.name, doc.content, {
          title: doc.name,
          createdAt: doc.createdAt,
          updatedAt: doc.updatedAt,
        });

        // In MVP, we export to a local folder configured by env/settings
        // The user can then import from this folder into AFFiNE manually
        return {
          success: true,
          data: {
            id,
            filename: result.filename,
            path: result.path,
            message:
              'Document exported to AFFiNE sync folder. You can now import it into AFFiNE manually.',
          },
        };
      } catch (err) {
        console.error('Failed to sync document:', err);
        reply.status(500).send({ success: false, error: 'Failed to sync to AFFiNE folder' });
      }
    }
  );

  // POST /api/sync/affine/multiple - Sync multiple documents
  app.post<{ Body: SyncRequest; Reply: any }>('/api/sync/affine/multiple', async (request, reply) => {
    const { documentIds } = request.body;

    if (!documentIds || documentIds.length === 0) {
      reply.status(400).send({ success: false, error: 'No document IDs provided' });
      return;
    }

    const results = [];

    for (const id of documentIds) {
      const doc = await documentService.getDocument(id);
      if (!doc) continue;

      try {
        const result = await exportService.exportAsMarkdown(doc.name, doc.content, {
          title: doc.name,
          createdAt: doc.createdAt,
          updatedAt: doc.updatedAt,
        });

        results.push({
          id,
          filename: result.filename,
          success: true,
        });
      } catch (err) {
        results.push({
          id,
          success: false,
          error: 'Failed to sync',
        });
      }
    }

    return {
      success: true,
      data: {
        synced: results.filter((r) => r.success).length,
        failed: results.filter((r) => !r.success).length,
        results,
      },
    };
  });
}
