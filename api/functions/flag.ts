import { withAuth0 } from '@netlify/auth0';
import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { getXataClient } from 'xata';

const client = getXataClient();

const handler: Handler = withAuth0(
  async (event: HandlerEvent, context: HandlerContext) => {
    try {
      const sub: string = context.clientContext?.['user']['sub'];

      const user = await client.db.users.getFirstOrThrow({
        filter: {
          user_id: sub,
        },
      });

      const id = event.queryStringParameters!['id']!;
      const flag = JSON.parse(event.body!);

      const hasBeenFlagged = Boolean(
        await client.db.flags.getFirst({
          filter: {
            point: { id },
            flagged_by: user.id,
          },
        })
      );

      if (hasBeenFlagged) {
        return { statusCode: 403, body: 'Can not flag the same point twice.' };
      }

      const point = await client.db.points.getFirstOrThrow({filter: {id}});

      if (point.publisher!.id === user.id) {
        return { statusCode: 403, body: 'Can not flag a point which one owns.' };
      }

      await client.db.flags.create({
        ...flag,
        point: { id },
        flagged_by: user.id,
      });

      return { statusCode: 200, body: '' };
    } catch (e) {
      console.error(e);
      return { statusCode: 500, body: 'Could not flag a point.' };
    }
  },
  {
    auth0: {
      required: true,
    },
  }
);

export { handler };
