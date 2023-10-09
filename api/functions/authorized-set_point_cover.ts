import { withAuth0 } from '@netlify/auth0';
import type { Handler, HandlerContext, HandlerEvent } from '@netlify/functions';
import { XataFile } from '@xata.io/client';
import { getSub, userFromSub } from 'api/utils/sub';
import sharp from 'sharp';
import { COVER_RATIO } from 'src/app/cover-image/consts';
import { getXataClient } from 'xata';

const client = getXataClient();

const handler: Handler = withAuth0(
  async (event: HandlerEvent, context: HandlerContext) => {
    // try {
    const pointId: string = event.queryStringParameters!['id']!;

    const user = await userFromSub(context);

    const { point, user: publisher } =
      await client.db.users_points.getFirstOrThrow({
        filter: { point: pointId },
      });

    if (publisher!.id !== user!.id) {
      return {
        statusCode: 403,
        body: 'Can not set cover of a point if one does not own it.',
      };
    }

    const { base64Content } = JSON.parse(event.body!);

    const shImg = sharp(Buffer.from(base64Content, 'base64')).webp({
      smartSubsample: true,
      nearLossless: true,
    });

    const meta = await shImg.metadata();
    const height = Math.round(
      (Math.min(meta.width!, 2048) / COVER_RATIO.W_RATIO) * COVER_RATIO.H_RATIO
    );

    const webpBuff = await shImg.resize({ height, fit: 'fill' }).toBuffer();

    const cover = XataFile.fromBuffer(webpBuff, {
      mediaType: 'image/webp',
      signedUrlTimeout: 600
    });

    if (cover.size! > 3e6) {
      return { statusCode: 400, body: 'File size exceeded.' };
    }

    await client.db.points.update(pointId, {
      cover,
    });

    const withCover = await client.db.points.getFirstOrThrow({
      filter: { id: pointId },
      columns: ['cover.signedUrl'],
    });

    return {
      statusCode: 200,
      body: JSON.stringify(withCover.cover),
    };
    // } catch (e) {
    //   console.error(e);
    //   return {
    //     statusCode: 500,
    //     body: 'Could not save the cover.',
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
