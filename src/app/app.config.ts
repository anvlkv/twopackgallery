import { IMAGE_LOADER, registerLocaleData } from '@angular/common';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import en from '@angular/common/locales/en';
import {
  ApplicationConfig,
  importProvidersFrom,
  isDevMode,
} from '@angular/core';
import { provideClientHydration } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { TitleStrategy } from '@angular/router';
import { ServiceWorkerModule } from '@angular/service-worker';
import { NZ_CONFIG, NzConfig } from 'ng-zorro-antd/core/config';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NZ_I18N, en_US } from 'ng-zorro-antd/i18n';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzNotificationModule } from 'ng-zorro-antd/notification';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { xataImageLoader } from '../xata.imageloader';
import { ActivityService } from './activity.service';
import { ArtFormsService } from './art-forms.service';
import { BrowserStorageService } from './browser-storage.service';
import { ErrorInterceptor } from './error.interceptor';
import { LocationService } from './location.service';
import { PointsService } from './points.service';
import { RetryInterceptor } from './retry.interceptor';
import { TemplatePageTitleStrategy } from './title.strategy';
import { UserService } from './user.service';
import { ZoomSyncService } from './zoom-sync.service';

const httpInterceptorProviders = [
  { provide: HTTP_INTERCEPTORS, useClass: RetryInterceptor, multi: true },
  { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },
];

const ngZorroConfig: NzConfig = {
  notification: {
    nzDuration: 7000,
    nzPlacement: 'top',
  },
};

registerLocaleData(en);

const providersFrom = [
  HttpClientModule,
  BrowserAnimationsModule,
  NzModalModule,
  NzToolTipModule,
  NzNotificationModule,
  NzDrawerModule,
  ServiceWorkerModule.register('ngsw-worker.js', {
    enabled: !isDevMode(),
    // Register the ServiceWorker as soon as the application is stable
    // or after 30 seconds (whichever comes first).
    registrationStrategy: 'registerWhenStable:30000',
  }),
].map((mod) => importProvidersFrom(mod));

export const appConfig: ApplicationConfig = {
  providers: [
    provideClientHydration(),
    PointsService,
    LocationService,
    ArtFormsService,
    ZoomSyncService,
    ActivityService,
    BrowserStorageService,
    UserService,
    { provide: NZ_CONFIG, useValue: ngZorroConfig },
    { provide: NZ_I18N, useValue: en_US },
    { provide: TitleStrategy, useClass: TemplatePageTitleStrategy },
    { provide: IMAGE_LOADER, useValue: xataImageLoader },
    httpInterceptorProviders,
    ...providersFrom,
  ],
};
