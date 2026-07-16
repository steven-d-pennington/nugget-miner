import { z } from 'zod';

const clientIdSchema = z.string().uuid();

export function requestIdentity(request: Request, clientId?: string) {
  if (clientId && clientIdSchema.safeParse(clientId).success) return `client:${clientId}`;

  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return `ip:${forwarded || 'unknown'}`;
}
