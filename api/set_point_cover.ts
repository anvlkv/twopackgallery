import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { XataFile } from '@xata.io/client';
import { parseMultipartForm } from 'uitls/parseMultipartFormData';
import { getXataClient } from 'xata';

const client = getXataClient();

const handler: Handler = async (
  event: HandlerEvent,
  context: HandlerContext
) => {
  try {
    const pointId: string = event.queryStringParameters!['id']!;

    console.log('parsing');

    const { base64Content, mediaType } = JSON.parse(event.body!);

    console.log('creating file');

    const cover = XataFile.fromBase64(base64Content, {
      mediaType,
      enablePublicUrl: true
    });

    if (cover.size! > 3e6) {
      return { statusCode: 400, body: 'File size exceeded.' };
    }

    if (
      !['image/png', 'image/jpeg', 'image/gif', 'image/bmp'].includes(
        cover.mediaType
      )
    ) {
      return { statusCode: 400, body: 'Unsupported file type.' };
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
