import type {
  Handler,
  HandlerEvent,
  HandlerContext,
  HandlerResponse,
} from '@netlify/functions';
import { getXataClient } from '../xata';

const client = getXataClient();

const handler: Handler = async (
  event: HandlerEvent,
  context: HandlerContext
) => {
  try {
    const art_forms = await client.db.art_forms.getAll({sort: 'name', columns: ['id', 'name']});
  
    const records = art_forms.map(a => a.toSerializable());
  
    return { statusCode: 200, body: JSON.stringify(Array.from(records)) };
  }
  catch (e) {
    console.error(e);

    return {statusCode: 500, body: 'Could not get art forms.'}
  }
};

export { handler };
