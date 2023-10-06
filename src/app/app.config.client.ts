import { HTTP_INTERCEPTORS } from '@angular/common/http';
import {
  ApplicationConfig,
  importProvidersFrom,
  isDevMode,
  mergeApplicationConfig,
} from '@angular/core';
import { AuthModule, AuthHttpInterceptor } from '@auth0/auth0-angular';
import { environment } from 'src/environments/environment';
import { appConfig } from './app.config';
import { LocalStorage } from './browser-storage.service';
import { RouterModule } from '@angular/router';
import { appRoutes } from './app-routes';

function storageFactory(): Storage {
  return localStorage;
}

const clientConfig: ApplicationConfig = {
  providers: [
    importProvidersFrom(
      RouterModule.forRoot(appRoutes, {
        enableTracing: isDevMode(),
      }),
    ),
    importProvidersFrom(
      AuthModule.forRoot({
        cacheLocation: 'localstorage',
        domain: environment.auth0.domain,
        clientId: environment.auth0.clientId,
        authorizationParams: {
          redirect_uri: window.location.origin,
          audience: environment.auth0.audience,
        },
        httpInterceptor: {
          allowedList: [
            {
              uri: '/.netlify/functions/authorized-*',
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
