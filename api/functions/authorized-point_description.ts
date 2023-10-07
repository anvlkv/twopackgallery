import { withAuth0 } from '@netlify/auth0';
import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { JSONData } from '@xata.io/client';
import { EPointStatus } from 'api/utils/point_status';
import { userFromSub } from 'api/utils/sub';
import { UserPointStatus } from 'src/app/point.types';
import { PointsRecord, getXataClient } from 'xata';

const client = getXataClient();

const handler: Handler = withAuth0(
  async (event: HandlerEvent, context: HandlerContext) => {
    // try {
    const id = event.queryStringParameters?.['id']!;

    const user = await userFromSub(context);

    let af_pts = client.db.art_forms_points.all();

    const ownership =
      user &&
      (await client.db.users_points.getFirst({
        filter: {
          user: user.id,
          point: id,
          status: UserPointStatus.Owner,
        },
      }));
    if (ownership) {
      af_pts = af_pts.filter({ point: id });
    } else {
      af_pts = af_pts.filter({
        point: {
          id,
          status: { $any: [EPointStatus.Published, EPointStatus.Protected] },
        },
      });
    }

    const pointArtForms = await af_pts.getAll({
      columns: ['form.id', 'form.name', 'point.id'],
    });

    if (!pointArtForms.length) {
      return {
        statusCode: 404,
        body: 'Point data not found',
      };
    }

    const pointData = await client.db.points.getFirstOrThrow({
      filter: { id },
      columns: [
        'address',
        'cover',
        'description',
        'location_description',
        'title',
        'id',
        'longitude',
        'latitude',
        'status',
      ],
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        art_forms: pointArtForms.map(({ form }) => form?.toSerializable()),
        ...pointData.toSerializable(),
      }),
    };
    // } catch (e) {
    //   console.error(e);
    //   return {
    //     statusCode: 500,
    //     body: 'Could not run the query.',
    //   };
    // }
  },
  {
    auth0: {
      required: false,
    },
  }
);

export { handler };
