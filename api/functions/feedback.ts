import { withAuth0 } from '@netlify/auth0';
import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { getXataClient } from 'xata';

const client = getXataClient();

const handler: Handler = withAuth0(
  async (event: HandlerEvent, context: HandlerContext) => {
    try {
      const sub: string = context.clientContext?.['user']['sub'];

      const user = await client.db.users.getFirstOrThrow({
        filter: {
          user_id: sub,
        },
      });

      const { feedback_type, description } = JSON.parse(event.body!);

      await client.db.feedback.create({
        feedback_type,
        description,
        user_email: user.email,
      });

      return { statusCode: 200, body: '' };
    } catch (e) {
      console.error(e);
      return { statusCode: 500, body: 'Could not update user.' };
    }
  },
  {
    auth0: {
      required: true,
    },
  }
);

export { handler };
