import type {
  Handler,
  HandlerEvent,
  HandlerContext,
} from '@netlify/functions';
import { getXataClient } from 'xata';

const client = getXataClient();

const handler: Handler = async (
  event: HandlerEvent,
  context: HandlerContext
) => {
  try {
    const id = event.queryStringParameters!['id']!;
    const flag = JSON.parse(event.body!);

    const hasBeenFlagged = Boolean(await client.db.flags.getFirst({
      filter: {
        point: {id},
        // TODO: add user id
        flagged_by: {id: ''}
      },
    }))

    if (hasBeenFlagged) {
      return { statusCode: 400, body: 'Can not flag the same point twice.' };
    }
  
    await client.db.flags.create({
      ...flag,
      point: {id}
    });

    return { statusCode: 200, body: '' };
  }
  catch (e) {
    console.error(e);
    return { statusCode: 500, body: 'Could not flag a point.' };
  }
};

export { handler };
