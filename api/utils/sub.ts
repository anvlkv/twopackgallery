import type { HandlerContext } from '@netlify/functions';

export function getSub(
  ctx: HandlerContext & {
    identityContext?: { claims: { sub: string } };
  }
): string | undefined {
  try {
    return ctx.identityContext?.claims.sub;
  } catch {
    return ctx.clientContext?.['user']['sub'];
  }
}
