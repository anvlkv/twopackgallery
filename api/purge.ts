import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { getXataClient } from 'xata';

const client = getXataClient();

const handler: Handler = async (
  event: HandlerEvent,
  context: HandlerContext
) => {
  try {
    console.log(process.env['NODE_ENV']);
    if (process.env['NODE_ENV'] === 'development') {
      let count = 0;
      for (let table of [client.db.art_forms_points, client.db.flags, client.db.points, client.db.users]) {
        const ids = (await table.getAll({columns: ['id']} as any)).map(({id}) => id);
        await Promise.all(ids.map(id => table.delete(id)));
        count += ids.length;
      }
      return {
        statusCode: 200,
        body: `Deleted: ${count} entries`
      }
    }
    else {
      return {
        statusCode: 403,
        body: 'Will not purge production dbs'
      }
    }
    
  } catch (e) {
    console.error(e);
    return {
      statusCode: 500,
      body: 'Could not purge.',
    };
  }
};

export { handler };
