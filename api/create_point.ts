import type {
  Handler,
  HandlerEvent,
  HandlerContext,
} from '@netlify/functions';
import { withAuth0 } from "@netlify/auth0";
import { getXataClient } from 'xata';

const client = getXataClient();

const handler: Handler = withAuth0(async (
  event: HandlerEvent,
  context: HandlerContext
) => {
  try {
    console.log(context.identity)
    
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
});

export { handler };
