import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { EPointStatus } from 'api/utils/point_status';
import { getXataClient } from 'xata';

const client = getXataClient();

const handler: Handler = async (
  event: HandlerEvent,
  context: HandlerContext
) => {
  // try {
  const title = event.queryStringParameters?.['title'];
  const bBox = event.queryStringParameters?.['bBox'];
  const consistency = event.queryStringParameters?.['consistency'];

  let points = client.db.points
    .all()
    .filter({ status: EPointStatus.Published });

  if (title) {
    points = points.filter({ title });
  }

  if (bBox) {
    const [minLon, minLat, maxLon, maxLat] = bBox
      .split(',')
      .map((v) => parseFloat(v));
    points = points.filter({
      longitude: {
        $ge: minLon,
        $le: maxLon,
      },
      latitude: {
        $ge: minLat,
        $le: maxLat,
      },
    });
  }

  if (event.httpMethod.toUpperCase() === 'POST') {
    const excluded: string[] = JSON.parse(event.body!);
    points = points.filter({
      $not: {
        $any: excluded.map((id) => ({ id })),
      },
    });
  }

  const data = await points.getAll({
    columns: ['title', 'id', 'latitude', 'longitude', 'publisher.id'],
    consistency: consistency ? 'strong' : 'eventual',
  });

  return {
    statusCode: 200,
    body: JSON.stringify(data.map((d) => d.toSerializable())),
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
