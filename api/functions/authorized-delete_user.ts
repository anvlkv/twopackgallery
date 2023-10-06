import { withAuth0 } from '@netlify/auth0';
import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { withAuth0Token } from 'api/utils/auth0';
import { getSub } from 'api/utils/sub';
import { UserPointStatus } from 'src/app/point.types';
import { getXataClient } from 'xata';

const client = getXataClient();

const handler: Handler = withAuth0(
  async (event: HandlerEvent, context: HandlerContext) => {
    // try {
      const sub = getSub(context)!;

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

      const ownedPoints = await client.db.users_points
        .filter({ user, status: UserPointStatus.Owner })
        .getAll({ columns: ['id', 'point.id'] });

      for (let { id: ownership_id, point } of ownedPoints) {
        await client.db.points.update({ id: (point as any).id, status: 'user_deleted' });
        await client.db.users_points.delete(ownership_id);
      }

      const otherPoints = await client.db.users_points
        .filter({ user })
        .getAll({ columns: ['id'] });

      for (let {id} of otherPoints) {
        await client.db.users_points.delete(id);
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
