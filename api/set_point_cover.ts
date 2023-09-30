import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { XataFile } from '@xata.io/client';
import sharp from 'sharp';
import { COVER_RATIO } from 'src/app/cover-image/cover-image.component';
import { getXataClient } from 'xata';

const client = getXataClient();

const handler: Handler = async (
  event: HandlerEvent,
  context: HandlerContext
) => {
  try {
    const pointId: string = event.queryStringParameters!['id']!;

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
};

export { handler };
