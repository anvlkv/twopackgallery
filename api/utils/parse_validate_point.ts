import { HandlerEvent } from '@netlify/functions';
import { getXataClient } from 'xata';
import { EPointStatus } from './point_status';

const client = getXataClient();

export async function parseValidatePoint(event: HandlerEvent, publicationAllowed: boolean, id?: string) {
  const data = JSON.parse(event.body!);
  const { art_forms, latitude, longitude, title, status } = data;

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

  if (status !== EPointStatus.Draft && !publicationAllowed) {
    throw new Error('Cannot accept non draft');
  }

  if (![EPointStatus.Draft, EPointStatus.Published].includes(status)) {
    throw new Error('Cannot accept other status');
  }

  if (id) {
    const {status: currentStatus} = await client.db.points.getFirstOrThrow({filter: {id}, columns: ['status']});

    if (![EPointStatus.Draft, EPointStatus.Published, EPointStatus.Protected].includes(currentStatus as EPointStatus)) {
      throw new Error('Wont accept status changes');
    }
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
