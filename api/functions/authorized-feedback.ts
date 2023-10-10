import { withAuth0 } from '@netlify/auth0';
import type { Handler, HandlerContext, HandlerEvent } from '@netlify/functions';
import { EMailBox, sendEmail } from 'api/utils/send_email';
import { userFromSub } from 'api/utils/sub';
import { getXataClient } from 'xata';

const client = getXataClient();

const handler: Handler = withAuth0(
  async (event: HandlerEvent, context: HandlerContext) => {
    // try {
    const user = await userFromSub(context);

    const { feedback_type, description } = JSON.parse(event.body!);

    await client.db.feedback.create({
      feedback_type,
      description,
      user_email: user!.email,
    });

    const sendResult = await sendEmail(
      EMailBox.Support,
      user!.email!,
      `Your ${feedback_type} feedback at twopack.gallery`,
      'feedback',
      {
        user_name: user!.name,
        feedback_type: feedback_type,
        feedback_text: description,
      },
      true
    );

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
