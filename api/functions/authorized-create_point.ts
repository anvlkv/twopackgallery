import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { withAuth0 } from '@netlify/auth0';
import { getXataClient } from 'xata';
import { getSub } from 'api/utils/sub';
import { parseValidatePoint } from 'api/utils/parse_validate_point';
import { UserPointStatus } from 'src/app/point.types';

const client = getXataClient();

const handler: Handler = withAuth0(
  async (event: HandlerEvent, context: HandlerContext) => {      
      const sub = getSub(context)!;

      const user = await client.db.users.getFirstOrThrow({
        filter: {
          user_id: sub,
        },
      });

      const { art_forms, ...pointData } = await parseValidatePoint(event, user.status === 'verified');

      const newPoint = await client.db.points.create({
        ...pointData,
      });

      for (let id of art_forms as string[]) {
        await client.db.art_forms_points.create({
          form: { id },
          point: { id: newPoint.id },
        });
      }

      const ownership = await client.db.users_points.create({point: newPoint, user, status: UserPointStatus.Owner})

      return { statusCode: 200, body: JSON.stringify(ownership.point) };
    // } catch (e) {
    //   console.error(e);
    //   return { statusCode: 500, body: 'Could not save new point.' };
    // }
  },
  {
    auth0: {
      required: true,
    },
  }
);

export { handler };
