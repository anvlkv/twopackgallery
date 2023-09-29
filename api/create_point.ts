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
    const {
      art_forms,
      ...pointData
    } = JSON.parse(event.body!);
  
    const newPoint = await client.db.points.create(pointData);
  
    for (let id of art_forms as string[]) {
      await client.db.art_forms_points.create({ form: { id }, point: {id: newPoint.id} });
    }
  
    return { statusCode: 200, body: JSON.stringify(newPoint) };
  }
  catch (e) {
    console.error(e);
    return { statusCode: 500, body: 'Could not save new point.' };
  }
};

export { handler };
