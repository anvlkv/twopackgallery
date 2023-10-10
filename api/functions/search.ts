import type { Handler, HandlerContext, HandlerEvent } from '@netlify/functions';
import { EPointStatus } from 'api/utils/point_status';
import { ESearchType } from 'src/app/search.types';
import { PointsRecord, getXataClient } from 'xata';

const client = getXataClient();

const handler: Handler = async (
  event: HandlerEvent,
  context: HandlerContext
) => {
  // try {
  const query = event.queryStringParameters?.['query'];
  const queryType = event.queryStringParameters?.[
    'type'
  ]!.toLowerCase() as ESearchType;
  const constrain = event.queryStringParameters?.['constrain'];
  const skip = event.queryStringParameters?.['skip']
    ? parseInt(event.queryStringParameters['skip'])
    : 0;

  let sqlQuery = `SELECT ${['id', 'title', 'longitude', 'latitude']
    .map((c) => `"points".${c}`)
    .join(',')}
  FROM "points"
  `;

  const publishedCondition = `AND "points".status in ('${EPointStatus.Published}', '${EPointStatus.Protected}')`;

  const queryCondition = query
    ? `LOWER("points".title) LIKE LOWER($1)`
    : undefined;

  switch (queryType) {
    case ESearchType.ByArtForm: {
      sqlQuery += `
      INNER JOIN "art_forms_points" ON "art_forms_points".point = "points".id
      WHERE "art_forms_points".form = ${
        queryCondition
          ? `$3
      AND ${queryCondition}`
          : '$2'
      }
      `;
      break;
    }
    case ESearchType.ByPublisher: {
      sqlQuery += `
      INNER JOIN "users_points" ON "users_points".point = "points".id
      INNER JOIN "users" ON "users_points".user = "users".id
      WHERE "users".tag = ${
        queryCondition
          ? `$3
      AND ${queryCondition}`
          : '$2'
      }
      `;
      break;
    }
    default: {
      if (!queryCondition) {
        throw new Error('no query');
      }
      sqlQuery += `
      WHERE ${queryCondition}
      `;
      break;
    }
  }

  sqlQuery += `
  ${publishedCondition}
  ORDER BY "points".title ASC LIMIT 11 OFFSET ${queryCondition ? '$2' : '$1'};`;

  const { records } = await client.sql<PointsRecord>(
    sqlQuery,
    ...[queryCondition && `%${query}%`, skip, constrain].filter(
      (p) => p !== undefined
    )
  );

  const covers = await client.db.points.getAll({
    filter: { id: { $any: records.map((r) => r.id) } },
    columns: ['id', 'cover.signedUrl'],
  });

  // const withCovers

  return {
    statusCode: 200,
    body: JSON.stringify({
      data: records.slice(0, 10).map((r) => ({
        ...r,
        cover: covers.find(({ id }) => id === r.id)?.cover,
      })),
      hasNextPage: records.length >= 11,
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
