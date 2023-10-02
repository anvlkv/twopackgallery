import { withAuth0 } from '@netlify/auth0';
import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { XataFile } from '@xata.io/client';
import { withAuth0Token } from 'api/utils/auth0';
import { getXataClient } from 'xata';
import sharp from 'sharp';

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

      // https://auth0.com/docs/api/management/v2/users/patch-users-by-id
      const { email, name, avatarBase64 } = JSON.parse(event.body!);

      let picture = user.picture?.url;

      if (avatarBase64) {
        const { base64Content } = avatarBase64;

        const webpBuff = await sharp(Buffer.from(base64Content, 'base64'))
          .webp({
            smartSubsample: true,
            nearLossless: true,
          })
          .resize({
            width: 128,
            height: 128,
            fit: 'cover',
            withoutEnlargement: true,
          })
          .toBuffer();

        const file = XataFile.fromArrayBuffer(webpBuff, {
          mediaType: 'image/webp',
          enablePublicUrl: true,
        });

        const { picture: updatedPicture } = await client.db.users.updateOrThrow(
          { id: user.id, picture: file }
        );

        picture = updatedPicture!.url;
      }

      await withAuth0Token({
        url: `/api/v2/users/${sub}`,
        method: 'PATCH',
        data: {
          email,
          name,
          picture,
        },
      });

      await client.db.users.update({ id: user.id, email, name });

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
