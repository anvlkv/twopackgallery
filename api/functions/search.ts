import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { EPointStatus } from 'api/utils/point_status';
import { ESearchType } from 'src/app/search.types';
import { getXataClient } from 'xata';

const client = getXataClient();

const handler: Handler = async (
  event: HandlerEvent,
  context: HandlerContext
) => {
  // try {
  const query = event.queryStringParameters?.['query']!;
  const queryType = event.queryStringParameters?.['type']?.toLowerCase() as ESearchType | undefined;

  
  const {art_forms_points} = await client.search.byTable(query, {
    tables: ['art_forms_points'],
  });
  
  switch (queryType) {
    case ESearchType.ByArtForm: {
      break;
    }
    case ESearchType.ByPublisher: {
      break;
    }
    default: {
      break;
    }

  }

  // let points = client.db.points
  //   .all()
  //   .filter({ status: EPointStatus.Published });

  // if (title) {
  //   points = points.filter({ title });
  // }

  // if (bBox) {
  //   const [minLon, minLat, maxLon, maxLat] = bBox
  //     .split(',')
  //     .map((v) => parseFloat(v));
  //   points = points.filter({
  //     longitude: {
  //       $ge: minLon,
  //       $le: maxLon,
  //     },
  //     latitude: {
  //       $ge: minLat,
  //       $le: maxLat,
  //     },
  //   });
  // }

  // if (event.httpMethod.toUpperCase() === 'POST') {
  //   const excluded: string[] = JSON.parse(event.body!);
  //   points = points.filter({
  //     $not: {
  //       $any: excluded.map((id) => ({ id })),
  //     },
  //   });
  // }

  // const data = await points.getPaginated({
  //   columns: ['title', 'id', 'latitude', 'longitude', 'publisher.id'],
  //   consistency: consistency ? 'strong' : 'eventual',
  //   sort: { 'xata.createdAt': 'desc' },
  //   pagination: {
  //     size: 30
  //   }
  // });

  

  return {
    statusCode: 200,
    body: JSON.stringify({}),
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
