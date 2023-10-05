import axios from 'axios';

export enum EMailBox {
  NoReply = 'noreply',
  Support = 'support',
}

export async function sendEmail<D = any>(
  from: EMailBox,
  to: string,
  subject: string,
  template: string,
  parameters: D,
  bcc = false
) {
  const sender = `${from}@${process.env['NETLIFY_EMAILS_MAILGUN_DOMAIN']}`;
  const templateUrl = `${process.env['URL']}/.netlify/functions/emails/${template}`;

  console.log(process.env['NETLIFY_EMAILS_DIRECTORY'])

  return await fetch(
    templateUrl,
    {
      method: 'POST',
      headers: {
        'netlify-emails-secret': process.env['NETLIFY_EMAILS_SECRET'] as string,
      },
      body: JSON.stringify({
        from: sender,
        to,
        bcc: bcc ? sender : undefined,
        subject,
        parameters,
      }),
    }
  );
}
