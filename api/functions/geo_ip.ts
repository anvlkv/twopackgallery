import type { Handler, HandlerContext, HandlerEvent } from '@netlify/functions';
import { IPGeolocationAPI } from 'ip-geolocation-api-sdk-typescript';
import { GeolocationParams } from 'ip-geolocation-api-sdk-typescript/GeolocationParams';

const ipgeolocationApi = new IPGeolocationAPI(process.env['IP_GEO_KEY'], false);

const handler: Handler = async (
  event: HandlerEvent,
  context: HandlerContext
) => {
  const ip = event.headers['client-ip'];
  const params = new GeolocationParams();
  params.setIPAddress(ip!);
  params.setLang('en');
  params.setFields('longitude,latitude');
  const coords = await new Promise<[number, number]>((resolve, reject) => {
    ipgeolocationApi.getGeolocation((data) => {
      const resolvedData = [data.longitude, data.latitude] as [number, number];
      if (resolvedData.every((n) => !isNaN(n))) {
        resolve(resolvedData);
      } else {
        reject('did not resolve coords');
      }
    }, params);
  });

  return {
    statusCode: 200,
    body: JSON.stringify(coords),
  };
};

export { handler };
