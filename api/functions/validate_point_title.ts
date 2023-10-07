import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { EPointStatus } from 'api/utils/point_status';
import { getXataClient } from 'xata';

const client = getXataClient();

const handler: Handler = async (
  event: HandlerEvent,
  context: HandlerContext
) => {
  // try {
  const title = event.queryStringParameters?.['title']!;

  let points = client.db.points.all().filter({ title });

  const data = await points.getFirst({
    columns: ['title', 'id'],
  });

  return {
    statusCode: 200,
    body: JSON.stringify(data?.toSerializable()),
  };
  // } catch (e) {
  //   console.error(e);
  //   return {
  //     statusCode: 500,
  //     body: 'Could not run the query.',
  //   };
  // }
};

export { handler };
