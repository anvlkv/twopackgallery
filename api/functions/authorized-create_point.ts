import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { withAuth0 } from '@netlify/auth0';
import { getXataClient } from 'xata';
import { getSub } from 'api/utils/sub';
import { parseValidatePoint } from 'api/utils/parse_validate_point';
import { UserPointStatus } from 'src/app/point.types';
import { EPointStatus } from 'api/utils/point_status';
import { EMailBox, sendEmail } from 'api/utils/send_email';

const client = getXataClient();

const handler: Handler = withAuth0(
  async (event: HandlerEvent, context: HandlerContext) => {
    const sub = getSub(context)!;

    const user = await client.db.users.getFirstOrThrow({
      filter: {
        user_id: sub,
      },
    });

    const { art_forms, ...pointData } = await parseValidatePoint(
      event,
      user.status === 'verified'
    );

    const newPoint = await client.db.points.create({
      ...pointData,
    });

    for (let id of art_forms as string[]) {
      await client.db.art_forms_points.create({
        form: { id },
        point: { id: newPoint.id },
      });
    }

    const ownership = await client.db.users_points.create({
      point: newPoint,
      user,
      status: UserPointStatus.Owner,
    });

    console.log(newPoint.status)

    if (newPoint.status === EPointStatus.Published) {
      const sendResult = await sendEmail(
        EMailBox.Hello,
        user.email as string,
        'Your new pin 📍 at twopack.gallery',
        'created',
        {
          location_name: newPoint.title,
          user_name: user.name,
          location_url: `${process.env['URL']}/pin/${newPoint.id}`,
        },
        true
      );

      // console.log(sendResult)
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ point: newPoint, ownership: ownership }),
    };
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
