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
        url: '/dbconnections/change_password',
        data: {
          clientId: process.env['API_AUTH0_CLIENT_ID'],
          connection: 'Username-Password-Authentication',
          email: user!.email,
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
