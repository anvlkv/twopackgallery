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

    const user = await client.db.users.getFirstOrThrow({
      filter: {
        user_id: sub,
      },
    });

    // https://auth0.com/docs/api/management/v2/users/patch-users-by-id
    const { email, name, tag, avatarBase64 } = JSON.parse(event.body!);

    if (tag) {
      if(!await validateTag(user.id, tag)) {
        throw new Error('Invalid tag')
      }
    }

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

      const { picture: updatedPicture } = await client.db.users.updateOrThrow({
        id: user.id,
        picture: file,
      });

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

    await client.db.users.update({ id: user.id, email, name, tag });

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
