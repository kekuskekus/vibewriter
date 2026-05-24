import { FastifyRequest, FastifyReply } from 'fastify';

export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply,
  appAuthToken?: string
) {
  // If no auth token is configured, allow all requests
  if (!appAuthToken) {
    return;
  }

  const authHeader = request.headers.authorization;
  if (!authHeader) {
    reply.status(401).send({ error: 'Missing authorization header' });
    return;
  }

  const [scheme, token] = authHeader.split(' ');
  if (scheme !== 'Bearer' || token !== appAuthToken) {
    reply.status(401).send({ error: 'Invalid token' });
    return;
  }
}
