import { withAuth0 } from '@netlify/auth0';
import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { withAuth0Token } from 'api/utils/auth0';
import { getSub, userFromSub } from 'api/utils/sub';
import { getXataClient } from 'xata';

const client = getXataClient();

const handler: Handler = withAuth0(
  async (event: HandlerEvent, context: HandlerContext) => {
    // try {
    const user = await userFromSub(context)

    await withAuth0Token({
      method: 'POST',
      url: '/api/v2/jobs/verification-email',
      data: {
        user_id: user?.user_id,
      },
    });

    return { statusCode: 200, body: '' };
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
