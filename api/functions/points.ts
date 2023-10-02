import type {
  Handler,
  HandlerEvent,
  HandlerContext,
  HandlerResponse,
} from '@netlify/functions';
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

    let points = client.db.points.all().filter({ status: 'published' });

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

    // TODO: fix flags aggregation
    // const flagged_points = (
    //   await client.db.flags.aggregate({
    //     flagged: {
    //       topValues: {
    //         column: 'point.id',
    //       },
    //     },
    //   })
    // ).aggs.flagged.values
    //   .filter(({ $count }) => $count >= 5)
    //   .map(({ $key }) => ({id: $key as string}));

    const flagged_points = Array.from(
      (
        await client.db.flags.getAll({ columns: ['point.id'], cache: 30000 })
      ).reduce((acc, { point: { id } }: any) => {
        acc.set(id, (acc.get(id) || 0) + 1);
        return acc;
      }, new Map<string, number>())
    )
      .filter(([k, v]) => v >= 5)
      .map(([id]) => ({
        id,
      }));

    const data = await points.getAll({
      columns: ['title', 'id', 'latitude', 'longitude', 'publisher.id'],
      consistency: consistency ? 'strong' : 'eventual',
      filter: {
        $not: {
          $any: flagged_points,
        },
      },
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
