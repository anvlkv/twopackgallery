import { withAuth0 } from '@netlify/auth0';
import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { EPointStatus } from 'api/utils/point_status';
import { EMailBox, sendEmail } from 'api/utils/send_email';
import { getSub } from 'api/utils/sub';
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

    const id = event.queryStringParameters!['id']!;
    const flag = JSON.parse(event.body!);

    const hasBeenFlagged = Boolean(
      await client.db.flags.getFirst({
        filter: {
          point: { id },
          flagged_by: user.id,
        },
      })
    );

    if (hasBeenFlagged) {
      throw new Error('Can not flag the same point twice.');
    }

    const { point, user: publisher } =
      await client.db.users_points.getFirstOrThrow({
        filter: { point: id },
        columns: [
          'user.id',
          'point.status',
          'point.title',
          'user.email',
          'user.name',
        ],
      });

    if (publisher!.id === user.id) {
      throw new Error('Can not flag a point which one owns.');
    }

    const { id: flag_id } = await client.db.flags.create({
      ...flag,
      point: { id },
      flagged_by: user.id,
    });

    if (
      ![EPointStatus.Protected, EPointStatus.Flagged].includes(
        point!.status as EPointStatus
      )
    ) {
      const pointFlags = await client.db.flags.getMany({
        filter: { point: { id } },
        pagination: { size: 5 },
      });

      if (pointFlags.length >= 5) {
        await client.db.points.update({ id, status: EPointStatus.Flagged });
      }

      const title =
        pointFlags.length >= 5
          ? `Location hidden from public view until further investigation`
          : `There's possibly an issue with ${point!.title} on twopack.gallery`;

      const sendResult = await sendEmail(
        EMailBox.Support,
        publisher!.email!,
        title,
        'flagged',
        {
          location_name: point!.title,
          user_name: publisher!.name,
          flag_issue: flag.issue,
          notice:
            pointFlags.length >= 5
              ? 'Your pin has been automatically hidden from public. Please let us know if you think it is a mistake.'
              : 'In the meantime we will investigate the request and make decision on removing your pin from the public map.',
          flag_id,
        },
        true
      );
    }

    return { statusCode: 200, body: '' };
  },
  {
    auth0: {
      required: true,
    },
  }
);

export { handler };
