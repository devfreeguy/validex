import type { FastifyRequest } from 'fastify';

/**
 * Every discovery file needs to link to itself and its sibling resources by
 * absolute URL. Deriving it from the live request (rather than a hardcoded
 * env var) means the same code is correct on localhost, a Render preview,
 * and whatever production domain eventually fronts this - no config to keep
 * in sync.
 */
export function originOf(request: FastifyRequest): string {
  return `${request.protocol}://${request.hostname}`;
}
