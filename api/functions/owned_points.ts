import { withAuth0 } from '@netlify/auth0';
import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
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

      const points = await client.db.art_forms_points.getAll({
        filter: { point: { publisher: user.id } },
        columns: [
          'form.id',
          'point.address',
          'point.cover',
          'point.description',
          'point.location_description',
          'point.title',
          'point.id',
          'point.publisher.id',
          'point.longitude',
          'point.latitude',
        ],
      });

      return {
        statusCode: 200,
        body: JSON.stringify(points.map((p) => p.toSerializable())),
      };
    // } catch (e) {
    //   console.error(e);
    //   return {
    //     statusCode: 500,
    //     body: 'Could not get user points.',
    //   };
    // }
  },
  {
    auth0: {
      required: true,
    },
  }
);

export { handler };
