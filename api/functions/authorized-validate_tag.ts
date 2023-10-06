import { withAuth0 } from '@netlify/auth0';
import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { XataFile } from '@xata.io/client';
import { withAuth0Token } from 'api/utils/auth0';
import { getXataClient } from 'xata';
import sharp from 'sharp';
import { getSub } from 'api/utils/sub';
import { validateTag } from 'api/utils/validate_tag';

const client = getXataClient();

const handler: Handler = withAuth0(
  async (event: HandlerEvent, context: HandlerContext) => {
    // try {
    const sub = getSub(context)!;
    const tag = event.queryStringParameters?.['tag']!;

    const user = await client.db.users.getFirstOrThrow({
      filter: {
        user_id: sub,
      },
    });

    const result = await validateTag(user.id, tag);

    return { statusCode: 200, body: JSON.stringify(result) };
    // } catch (e) {
    //   console.error(e);
    //   return { statusCode: 500, body: 'Could not update user.' };
    // }
  },
  {
    auth0: {
      required: true,
    },
  }
);

export { handler };
