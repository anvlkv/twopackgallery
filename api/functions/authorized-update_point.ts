import { withAuth0 } from '@netlify/auth0';
import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { parseValidatePoint } from 'api/utils/parse_validate_point';
import { getSub } from 'api/utils/sub';
import { getXataClient } from 'xata';

const client = getXataClient();

const handler: Handler = withAuth0(
  async (event: HandlerEvent, context: HandlerContext) => {
    // try {
    const id = event.queryStringParameters!['id']!;

    const sub = getSub(context)!;

    const user = await client.db.users.getFirstOrThrow({
      filter: {
        user_id: sub,
      },
    });

    const { point, user: publisher } =
      await client.db.users_points.getFirstOrThrow({
        filter: { point: { id }, status: 'owner' },
      });

    if (publisher!.id !== user.id) {
      return {
        statusCode: 403,
        body: 'Can not update a point if one does not own it.',
      };
    }

    const oldArtForms = await client.db.art_forms_points.getAll({
      filter: { point: { id } },
      columns: ['id', 'form.id'],
    });

    if (event.httpMethod.toUpperCase() === 'PATCH') {
      const { art_forms, ...pointData } = await parseValidatePoint(
        event,
        user.status === 'verified',
        id
      );

      const updatedPoint = (await client.db.points.update({
        ...pointData,
        id,
      }))!;

      for (let { id } of oldArtForms.filter(
        ({ form: { id: form_id } }: any) => !art_forms.includes(form_id)
      )) {
        await client.db.art_forms_points.delete(id);
      }

      for (let id of (art_forms as string[]).filter(
        (id) =>
          !oldArtForms.find(({ form: { id: form_id } }: any) => form_id === id)
      )) {
        await client.db.art_forms_points.create({
          form: { id },
          point: { id: updatedPoint.id },
        });
      }

      return { statusCode: 200, body: JSON.stringify(updatedPoint) };
    } else if (event.httpMethod.toUpperCase() === 'DELETE') {
      const deleted = await client.db.points.delete(id);
      for (let { id } of oldArtForms) {
        await client.db.art_forms_points.delete(id);
      }
      return { statusCode: 200, body: JSON.stringify(deleted) };
    } else {
      return { statusCode: 400, body: 'Unsupported method.' };
    }
    // } catch (e) {
    //   console.error(e);
    //   return { statusCode: 500, body: 'Could not update point.' };
    // }
  },
  {
    auth0: {
      required: true,
    },
  }
);

export { handler };
