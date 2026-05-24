import Fastify from 'fastify';
import cors from '@fastify/cors';
import staticPlugin from '@fastify/static';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { authMiddleware } from './middleware/auth.js';
import { documentRoutes } from './routes/documents.js';
import { settingsRoutes } from './routes/settings.js';
import { syncRoutes } from './routes/sync.js';
import { initializeStorage } from './utils/storage.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const port = parseInt(process.env.PORT || '3000', 10);
const host = process.env.HOST || '0.0.0.0';
const appAuthToken = process.env.APP_AUTH_TOKEN;

async function start() {
  const app = Fastify({
    logger: true,
  });

  await app.register(cors, { origin: true });

  // Initialize storage directories
  await initializeStorage();

  // Health check endpoint (no auth required)
  app.get('/api/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // Register auth middleware for all /api/* endpoints except /api/health
  app.addHook('onRequest', async (request, reply) => {
    if (request.url.startsWith('/api/') && request.url !== '/api/health') {
      await authMiddleware(request, reply, appAuthToken);
    }
  });

  // Register routes
  await app.register(documentRoutes);
  await app.register(settingsRoutes);
  await app.register(syncRoutes);

  // Serve static frontend files in production
  const frontendPath = join(dirname(__dirname), '../web/dist');
  try {
    await app.register(staticPlugin, {
      root: frontendPath,
      prefix: '/',
      constraints: {},
    });

    // Fallback to index.html for SPA routing
    app.setNotFoundHandler((request, reply) => {
      if (request.url.startsWith('/api/')) {
        reply.status(404).send({ error: 'Not found' });
      } else {
        reply.sendFile('index.html');
      }
    });
  } catch (err) {
    console.log('Frontend dist not found, skipping static serve. Run "npm run build" first.');
  }

  try {
    await app.listen({ port, host });
    console.log(`Server running at http://localhost:${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
