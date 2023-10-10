export enum EMailBox {
  Hello = 'hello',
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
  const sender = `twopack.gallery | ${from} <${from}@${process.env['NETLIFY_EMAILS_MAILGUN_DOMAIN']}>`;
  // TODO: get stage url
  const templateUrl = `${process.env['URL']}/.netlify/functions/emails/${template}`;

  console.log(templateUrl);
  const result = await fetch(templateUrl, {
    method: 'POST',
    headers: {
      'netlify-emails-secret': process.env['NETLIFY_EMAILS_SECRET'] as string,
    },
    body: JSON.stringify({
      from: sender,
      to,
      subject,
      parameters,
    }),
  });

  if (bcc) {
    await fetch(templateUrl, {
      method: 'POST',
      headers: {
        'netlify-emails-secret': process.env['NETLIFY_EMAILS_SECRET'] as string,
      },
      body: JSON.stringify({
        from: sender,
        to: sender,
        subject,
        parameters,
      }),
    });
  }

  return result
}
