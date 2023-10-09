import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { EPointStatus } from 'api/utils/point_status';
import { getXataClient } from 'xata';

const client = getXataClient();

const handler: Handler = async (
  event: HandlerEvent,
  context: HandlerContext
) => {
  // TODO: use proper query

  const { records } = await client.sql(`
    SELECT DISTINCT "art_forms".*, "users_points".user, "users".tag FROM "art_forms"
    INNER JOIN "art_forms_points" ON "art_forms_points".form = "art_forms".id
    INNER JOIN "points" ON "art_forms_points".point = "points".id
    INNER JOIN "users_points" ON "points".id = "users_points".point
    INNER JOIN "users" ON "users_points".user = "users".id
    WHERE "points".status IN ('${EPointStatus.Published}', '${EPointStatus.Protected}');
  `);

  const { art_forms, tags } = records.reduce(
    (acc: { art_forms: Map<string, string>; tags: Set<string> }, rec: any) => {
      acc.art_forms.set(rec['id'], rec['name']);
      acc.tags.add(rec['tag']);
      return acc;
    },
    { art_forms: new Map<string, string>(), tags: new Set<string>() }
  );

  return {
    statusCode: 200,
    body: JSON.stringify({
      art_forms: Array.from(art_forms)
        .map(([id, name]) => ({ id, name }))
        .sort((a, b) => (a.name > b.name ? -1 : b.name > a.name ? 1 : 0)),
      tags: Array.from(tags.values()).sort(),
    }),
  };
};

export { handler };
