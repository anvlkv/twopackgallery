import { HandlerEvent } from '@netlify/functions';
import { getXataClient } from 'xata';

const client = getXataClient();

export async function parseValidatePoint(event: HandlerEvent, id?: string) {
  const data = JSON.parse(event.body!);
  const { art_forms, latitude, longitude, title } = data;

  if (isNaN(latitude) || isNaN(longitude)) {
    throw new Error('Invalid point position');
  }

  let points = client.db.points.all();

  points = points.filter({ longitude, latitude });

  if (id) {
    points = points.filter({
      $not: { id },
    });
  }

  const hasPointAtLocation = await points.getFirst({ columns: ['id'] });

  if (hasPointAtLocation) {
    throw new Error('Already has a point at a given location');
  }

  if (art_forms.length > 5) {
    throw new Error('Exceeded 5 art_forms');
  }

  if (art_forms.length === 0) {
    throw new Error('Must have at least one art_form');
  }

  if (!title) {
    throw new Error('Title is required');
  }

  return data;
}
