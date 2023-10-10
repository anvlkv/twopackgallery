import { withAuth0 } from '@netlify/auth0';
import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { XataFile } from '@xata.io/client';
import { withAuth0Token } from 'api/utils/auth0';
import { getXataClient } from 'xata';
import sharp from 'sharp';
import { getSub, userFromSub } from 'api/utils/sub';
import { validateTag } from 'api/utils/validate_tag';

const client = getXataClient();

const handler: Handler = withAuth0(
  async (event: HandlerEvent, context: HandlerContext) => {
    // try {

    const user = (await userFromSub(context))!;

    // https://auth0.com/docs/api/management/v2/users/patch-users-by-id

    const { email, name, tag, avatarBase64 } = JSON.parse(event.body!);


    if (tag) {
      if (!(await validateTag(user.id, tag))) {
        throw new Error('Invalid tag');
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

    const emailValue = email || user.email;
    const nameValue = name || user.name;
    const tagValue = typeof tag === 'string' ? tag : user.tag;

    await withAuth0Token({
      url: `/api/v2/users/${user.user_id}`,
      method: 'PATCH',
      data: {
        email:emailValue,
        name:nameValue,
        picture,
        user_metadata: { tag: tagValue },
      },
    });

    await client.db.users.update({ id: user.id, email: emailValue, name: nameValue, tag: tagValue });

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
