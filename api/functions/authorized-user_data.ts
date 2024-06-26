import { withAuth0 } from '@netlify/auth0';
import type { Handler, HandlerContext, HandlerEvent } from '@netlify/functions';
import { getSub } from 'api/utils/sub';
import { UserPointStatus } from 'src/app/point.types';
import { getXataClient } from 'xata';

const client = getXataClient();

const handler: Handler = withAuth0(
  async (event: HandlerEvent, context: HandlerContext) => {
    const sub = getSub(context)!;

    const user = await client.db.users.getFirstOrThrow({
      filter: {
        user_id: sub,
      },
    });

    const ownerships = await client.db.users_points.getAll({
      filter: { user: user.id, status: UserPointStatus.Owner },
      columns: [
        'point.id',
        'point.title',
        'point.longitude',
        'point.latitude',
        'point.description',
        'point.location_description',
        'point.status',
        'point.cover.signedUrl'
      ],
    });
    const contributions = await client.db.users_points.getAll({
      filter: { user: user.id, status: UserPointStatus.Contributor },
      columns: [
        'point.id',
        'point.title',
        'point.longitude',
        'point.latitude',
        'point.description',
        'point.location_description',
        'point.status',
        'point.cover'
      ],
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        user: user.toSerializable(),
        ownerships: ownerships.map((v) => v.toSerializable()),
        contributions: contributions.map((v) => v.toSerializable()),
      }),
    };
  },
  {
    auth0: {
      required: true,
    },
  }
);

export { handler };
