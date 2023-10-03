import { withAuth0 } from '@netlify/auth0';
import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { withAuth0Token } from 'api/utils/auth0';
import { getXataClient } from 'xata';

const client = getXataClient();

const handler: Handler = withAuth0(
  async (event: HandlerEvent, context: HandlerContext) => {
    // try {
      const sub: string = context.clientContext?.['user']['sub'];

      const user = await client.db.users.getFirstOrThrow({
        filter: {
          user_id: sub,
        },
      });

      const { reason } = JSON.parse(event.body!);

      await client.db.feedback.create({
        feedback_type: 'delete',
        user_email: user.email,
        description: reason,
      });

      const ownedPoints = await client.db.points
        .filter({ publisher: { id: user.id } })
        .getAll({ columns: ['id'] });

      for (let { id } of ownedPoints) {
        await client.db.points.update({ id, status: 'user_deleted', publisher: null });
      }

      await client.db.users.deleteOrThrow(user);

      await withAuth0Token({
        url: `/api/v2/users/${sub}`,
        method: 'DELETE',
      });

      return { statusCode: 200, body: '' };
    // } catch (e) {
    //   console.error(e);
    //   return { statusCode: 500, body: 'Could not update user.' };
    // }
  },
  {
    auth0: {
      required: true,
    },
  }
);

export { handler };
