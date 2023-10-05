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

    // if (hasBeenFlagged) {
    //   throw new Error('Can not flag the same point twice.');
    // }

    const point = await client.db.points.getFirstOrThrow({ filter: { id } });

    if (point.publisher!.id === user.id) {
      throw new Error('Can not flag a point which one owns.');
    }

    const { id: flag_id } = await client.db.flags.create({
      ...flag,
      point: { id },
      flagged_by: user.id,
    });

    if (
      ![EPointStatus.Protected, EPointStatus.Flagged].includes(
        point.status as EPointStatus
      )
    ) {
      const pointFlags = await client.db.flags.getMany({
        filter: { point: { id } },
        pagination: { size: 5 },
      });

      if (pointFlags.length >= 5) {
        await client.db.points.update({ id, status: EPointStatus.Flagged });
      }

      const publisher = await client.db.users.getFirstOrThrow({
        filter: { id: point.publisher!.id },
      });

      const sendResult = await sendEmail(
        EMailBox.Support,
        publisher.email!,
        `There's possibly an issue with ${point.title} on twopack.gallery`,
        'flagged',
        {
          location_name: point.title,
          user_name: publisher.name,
          flag_issue: flag.issue,
          flag_id,
        },
        true
      );

      return { statusCode: sendResult.status, body: await sendResult.text() };
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
