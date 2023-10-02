import { withAuth0 } from '@netlify/auth0';
import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { getXataClient } from 'xata';

const client = getXataClient();

const handler: Handler = withAuth0(
  async (event: HandlerEvent, context: HandlerContext) => {
    try {
      const pointId: string = event.queryStringParameters!['id']!;
      const requestSub: string = event.queryStringParameters!['sub']!;
      const sub: string = context.clientContext?.['user']['sub'];

      if (sub !== requestSub || !sub) {
        return {
          statusCode: 200,
          body: JSON.stringify(false),
        };
      }

      const user = await client.db.users.getFirstOrThrow({
        filter: {
          user_id: sub,
        },
      });

      const point = await client.db.points.getFirstOrThrow({
        filter: { id: pointId },
      });

      return {
        statusCode: 200,
        body: JSON.stringify(point.publisher!.id === user.id),
      };
    } catch (e) {
      console.error(e);
      return {
        statusCode: 500,
        body: 'Could not determine ownership',
      };
    }
  },
  {
    auth0: {
      required: false,
    },
  }
);

export { handler };
