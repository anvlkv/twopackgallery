import type {
  Handler,
  HandlerEvent,
  HandlerContext,
  HandlerResponse,
} from '@netlify/functions';
import { JSONData } from '@xata.io/client';
import { PointsRecord, getXataClient } from 'xata';

const client = getXataClient();

const handler: Handler = async (
  event: HandlerEvent,
  context: HandlerContext
) => {
  try {
    const id = event.queryStringParameters?.['id']!;

    const pointArtForms = await client.db.art_forms_points.getAll({
      filter: { point: { id, status: 'published' } },
      columns: [
        'form.id',
        'point.address',
        'point.cover',
        'point.description',
        'point.location_description',
        'point.title',
        'point.id',
        'point.publisher.id',
        'point.longitude',
        'point.latitude',
      ],
    });

    if (!pointArtForms.length) {
      return {
        statusCode: 404,
        body: 'Point data not found',
      };
    }

    const point = pointArtForms.reduce(
      (acc, { form, point }) => {
        const art_form = form!.toSerializable();
        const point_data = point!.toSerializable();
        acc = {
          art_forms: [...acc.art_forms, art_form.id!],
          ...point_data,
        };
        return acc;
      },
      { art_forms: [] as string[] } as Partial<JSONData<PointsRecord>> & {
        art_forms: string[];
      }
    );

    return {
      statusCode: 200,
      body: JSON.stringify(point),
    };
  } catch (e) {
    console.error(e);
    return {
      statusCode: 500,
      body: 'Could not run the query.',
    };
  }
};

export { handler };
