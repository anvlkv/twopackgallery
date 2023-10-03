import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideServerRendering } from '@angular/platform-server';
import { appConfig } from './app.config';
import { AuthService, AuthConfigService } from '@auth0/auth0-angular';
import { LocalStorage } from './browser-storage.service';
import StorageShim from 'node-storage-shim';
import { NEVER, of } from 'rxjs';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(),
    {
      provide: AuthService,
      useValue: {
        isLoading$: of(false),
        isAuthenticated$: of(false),
        user$: of(null),
        error$: NEVER,
      },
    },
    { provide: AuthConfigService, useValue: {} as any },
    { provide: LocalStorage, useClass: StorageShim },
  ],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
