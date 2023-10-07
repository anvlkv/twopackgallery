import type { HandlerContext } from '@netlify/functions';
import { getXataClient } from 'xata';

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

const client = getXataClient();

export async function userFromSub(ctx: HandlerContext & {
  identityContext?: { claims: { sub: string } };
}) {
  const sub = getSub(ctx);

  if (sub) {
    const user = await client.db.users.getFirstOrThrow({
      filter: {
        user_id: sub,
      },
    });
  
    return user
  }
  else {
    return undefined
  }
}