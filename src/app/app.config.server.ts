import {
  ApplicationConfig,
  importProvidersFrom,
  mergeApplicationConfig,
} from '@angular/core';
import { provideServerRendering } from '@angular/platform-server';
import { RouterModule } from '@angular/router';
import { AuthConfigService, AuthService } from '@auth0/auth0-angular';
import StorageShim from 'node-storage-shim';
import { NEVER, noop, of } from 'rxjs';
import { appRoutes } from './app-routes';
import { appConfig } from './app.config';
import { LocalStorage } from './browser-storage.service';

const serverConfig: ApplicationConfig = {
  providers: [
    importProvidersFrom(RouterModule.forRoot(appRoutes)),
    provideServerRendering(),
    {
      provide: AuthService,
      useValue: {
        isLoading$: of(false),
        isAuthenticated$: of(false),
        user$: of(null),
        error$: NEVER,
        loginWithRedirect: noop,
      },
    },
    { provide: AuthConfigService, useValue: {} as any },
    { provide: LocalStorage, useClass: StorageShim },
  ],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
