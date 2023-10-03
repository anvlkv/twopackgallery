import { HTTP_INTERCEPTORS } from '@angular/common/http';
import {
  ApplicationConfig,
  importProvidersFrom,
  mergeApplicationConfig,
} from '@angular/core';
import { AuthModule, AuthHttpInterceptor } from '@auth0/auth0-angular';
import { environment } from 'src/environments/environment';
import { appConfig } from './app.config';
import { LocalStorage } from './browser-storage.service';

function storageFactory(): Storage {
  return localStorage;
}

const clientConfig: ApplicationConfig = {
  providers: [
    importProvidersFrom(
      AuthModule.forRoot({
        domain: environment.auth0.domain,
        clientId: environment.auth0.clientId,
        authorizationParams: {
          redirect_uri: environment.auth0.redirect_uri,
          audience: environment.auth0.audience,
        },
        httpInterceptor: {
          allowedList: [
            {
              uri: '/.netlify/functions/*',
              allowAnonymous: true,
            },
          ],
        },
      })
    ),
    { provide: HTTP_INTERCEPTORS, useClass: AuthHttpInterceptor, multi: true },
    { provide: LocalStorage, useFactory: storageFactory },
  ],
};

export const config = mergeApplicationConfig(appConfig, clientConfig);
