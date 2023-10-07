import axios, { AxiosRequestConfig } from 'axios';

export const auth0Url = `https://${process.env['API_AUTH0_DOMAIN']}`;

const options: AxiosRequestConfig = {
  method: 'POST',
  url: `${auth0Url}/oauth/token`,
  headers: { 'content-type': 'application/json' },
  data: `{"client_id":"${
    process.env['API_AUTH0_CLIENT_ID']
  }","client_secret":"${process.env['API_AUTH0_SECRET']}","audience":"${[
    process.env['API_AUTH0_AUDIENCE'],
  ]}","grant_type":"client_credentials"}`,
};

async function getToken() {
  const response = await axios.request<{
    token_type: string;
    access_token: string;
  }>(options);

  return response.data;
}

export async function withAuth0Token<T = any, R = any>(options: AxiosRequestConfig<T>) {
  const { token_type, access_token } = await getToken();

  const url = options.url?.startsWith(auth0Url) ? options.url : `${auth0Url}${options.url}`;

  return await axios.request<R>({
    ...options,
    url,
    headers: {
      ...options.headers,
      Authorization: `${token_type} ${access_token}`,
    },
  }).catch(e => {
    console.error(e)
    throw e;
  });
}
