import { withAuth0 } from '@netlify/auth0';
import type { Handler, HandlerContext, HandlerEvent } from '@netlify/functions';
import { XataFile } from '@xata.io/client';
import { getSub, userFromSub } from 'api/utils/sub';
import sharp from 'sharp';
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
    const height = Math.min(meta.width!, 2048);
    const width = height;

    const webpBuff = await shImg.resize({ height, width, fit: 'fill' }).toBuffer();

    const tile = XataFile.fromBuffer(webpBuff, {
      mediaType: 'image/webp',
      enablePublicUrl: true,
    });

    if (tile.size! > 3e6) {
      return { statusCode: 400, body: 'File size exceeded.' };
    }

    const savedPoint = await client.db.points.update(pointId, {
      tile,
    });

    return {
      statusCode: 200,
      body: JSON.stringify(savedPoint?.tile),
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
