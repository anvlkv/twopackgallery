import { withAuth0 } from '@netlify/auth0';
import type { Handler, HandlerContext, HandlerEvent } from '@netlify/functions';
import { XataFile } from '@xata.io/client';
import sharp from 'sharp';
import { COVER_RATIO } from 'src/app/cover-image/consts';
import { getXataClient } from 'xata';

const client = getXataClient();

const handler: Handler = withAuth0(
  async (event: HandlerEvent, context: HandlerContext) => {
    try {
      const pointId: string = event.queryStringParameters!['id']!;

      const sub: string = context.clientContext?.['user']['sub'];

      const user = await client.db.users.getFirstOrThrow({
        filter: {
          user_id: sub,
        },
      });

      const point = await client.db.points.getFirstOrThrow({filter: {id: pointId}});

      if (point.publisher!.id !== user.id) {
        return { statusCode: 403, body: 'Can not set cover of a point if one does not own it.' };
      }

      const { base64Content } = JSON.parse(event.body!);

      const shImg = sharp(Buffer.from(base64Content, 'base64')).webp({
        smartSubsample: true,
        nearLossless: true,
      });

      const meta = await shImg.metadata();
      const height = Math.round(
        (Math.min(meta.width!, 2048) / COVER_RATIO.W_RATIO) *
          COVER_RATIO.H_RATIO
      );

      const webpBuff = await shImg.resize({ height, fit: 'fill' }).toBuffer();

      const cover = XataFile.fromBuffer(webpBuff, {
        mediaType: 'image/webp',
        enablePublicUrl: true,
      });

      if (cover.size! > 3e6) {
        return { statusCode: 400, body: 'File size exceeded.' };
      }

      const savedPoint = await client.db.points.update(pointId, {
        cover,
      });

      return {
        statusCode: 200,
        body: JSON.stringify(savedPoint?.cover),
      };
    } catch (e) {
      console.error(e);
      return {
        statusCode: 500,
        body: 'Could not save the cover.',
      };
    }
  },
  {
    auth0: {
      required: true,
    },
  }
);

export { handler };
