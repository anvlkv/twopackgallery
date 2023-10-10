import { withAuth0 } from '@netlify/auth0';
import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { withAuth0Token } from 'api/utils/auth0';
import { EPointStatus } from 'api/utils/point_status';
import { sendEmail, EMailBox } from 'api/utils/send_email';
import { userFromSub } from 'api/utils/sub';
import { UserPointStatus } from 'src/app/point.types';
import { getXataClient } from 'xata';

const client = getXataClient();

const handler: Handler = withAuth0(
  async (event: HandlerEvent, context: HandlerContext) => {
    // try {
    const user = await userFromSub(context);

    const { reason } = JSON.parse(event.body!);

    if (!reason?.length || !user) {
      throw new Error('missing data');
    }

    await withAuth0Token({
      url: `/api/v2/users/${user.user_id}`,
      method: 'DELETE',
    });

    const transactions: Parameters<typeof client.transactions.run>[0] = [
      {
        insert: {
          table: 'feedback',
          record: {
            feedback_type: 'delete',
            user_email: user.email,
            description: reason,
          },
        },
      },
    ];

    const points = await client.db.users_points
      .filter({ user })
      .getAll({ columns: ['id', 'point.id', 'status'] });

    let owned_count = 0,
      other_count = 0;

    for (let { id, point, status } of points) {
      if (status === UserPointStatus.Owner) {
        transactions.push({
          update: {
            table: 'points',
            id: point!.id,
            fields: {
              status: 'user_deleted',
            },
          },
        });
        owned_count++;
      } else {
        other_count++;
      }
      transactions.push({
        delete: {
          table: 'users_points',
          id: id,
        },
      });
    }

    const af_points = await client.db.art_forms_points
      .filter({
        'point.id': {
          $any: points
            .filter(({ status }) => status === UserPointStatus.Owner)
            .map(({ point }) => point!.id),
        },
      })
      .getAll({ columns: ['id'] });

    transactions.push(
      ...af_points.map(({ id }) => ({
        delete: {
          table: 'art_forms_points' as any,
          id,
        },
      }))
    );

    transactions.push({
      delete: {
        table: 'users',
        id: user.id,
      },
    });

    await client.transactions.run(transactions);

    const sendResult = await sendEmail(
      EMailBox.Support,
      user.email!,
      `Bye ${user.name} 🥲`,
      'deleted_account',
      {
        user_name: user!.name,
        owned_count,
        other_count,
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
};
