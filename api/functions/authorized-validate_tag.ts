import { withAuth0 } from '@netlify/auth0';
import type { Handler, HandlerContext, HandlerEvent } from '@netlify/functions';
import { userFromSub } from 'api/utils/sub';
import { validateTag } from 'api/utils/validate_tag';
import { getXataClient } from 'xata';

const client = getXataClient();

const handler: Handler = withAuth0(
  async (event: HandlerEvent, context: HandlerContext) => {
    // try {
    const tag = event.queryStringParameters?.['tag']!;

    const user = await userFromSub(context);

    const result = await validateTag(user!.id, tag);

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
