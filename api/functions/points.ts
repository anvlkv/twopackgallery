import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { EPointStatus } from 'api/utils/point_status';
import { getXataClient } from 'xata';

const client = getXataClient();

const handler: Handler = async (
  event: HandlerEvent,
  context: HandlerContext
) => {
  // try {
  const bBox = event.queryStringParameters?.['bBox'];
  const consistency = event.queryStringParameters?.['consistency'];

  let points = client.db.points
    .all().filter({ status: { $any: [EPointStatus.Published, EPointStatus.Protected] }, });


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

  const data = await points.getPaginated({
    columns: ['title', 'id', 'latitude', 'longitude'],
    consistency: consistency ? 'strong' : 'eventual',
    sort: { 'xata.createdAt': 'desc' },
    pagination: {
      size: 30
    }
  });

  

  return {
    statusCode: 200,
    body: JSON.stringify({
      hasNextPage: data.hasNextPage(),
      data: data.records.toArray().map(a => a.toSerializable()),
    }),
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
