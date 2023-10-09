import { withAuth0 } from '@netlify/auth0';
import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { withAuth0Token } from 'api/utils/auth0';
import { sendEmail, EMailBox } from 'api/utils/send_email';
import { userFromSub } from 'api/utils/sub';
import { UserPointStatus } from 'src/app/point.types';
import { getXataClient } from 'xata';

const client = getXataClient();

const handler: Handler = withAuth0(
  async (event: HandlerEvent, context: HandlerContext) => {
    // try {
      const user = await userFromSub(context)

      const { reason } = JSON.parse(event.body!);

      await client.db.feedback.create({
        feedback_type: 'delete',
        user_email: user!.email,
        description: reason,
      });

      await withAuth0Token({
        url: `/api/v2/users/${user!.user_id}`,
        method: 'DELETE',
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

      await client.db.users.deleteOrThrow(user!);

      const sendResult = await sendEmail(
        EMailBox.Support,
        user!.email!,
        `Bye ${user!.name} 😢`,
        'deleted_account',
        {
          user_name: user!.name,
          owned_count: ownedPoints.length,
          other_count: otherPoints.length,
        },
        true
      );

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

export const config = {
  type: 'experimental-background',
}
