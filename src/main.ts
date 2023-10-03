import { IMAGE_LOADER, registerLocaleData } from '@angular/common';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import en from '@angular/common/locales/en';
import { importProvidersFrom, isDevMode } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { RouterModule, TitleStrategy } from '@angular/router';
import { ServiceWorkerModule } from '@angular/service-worker';
import { AuthHttpInterceptor, AuthModule } from '@auth0/auth0-angular';
import { NZ_CONFIG, NzConfig } from 'ng-zorro-antd/core/config';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NZ_I18N, en_US } from 'ng-zorro-antd/i18n';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzNotificationModule } from 'ng-zorro-antd/notification';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { ActivityService } from './app/activity.service';
import { appRoutes } from './app/app-routes';
import { AppComponent } from './app/app.component';
import { ArtFormsService } from './app/art-forms.service';
import { BrowserStorageService } from './app/browser-storage.service';
import { ErrorInterceptor } from './app/error.interceptor';
import { LocationService } from './app/location.service';
import { PointsService } from './app/points.service';
import { RetryInterceptor } from './app/retry.interceptor';
import { TemplatePageTitleStrategy } from './app/title.strategy';
import { UserService } from './app/user.service';
import { ZoomSyncService } from './app/zoom-sync.service';
import { environment } from './environments/environment';
import { xataImageLoader } from './xata.imageloader';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

const httpInterceptorProviders = [
  { provide: HTTP_INTERCEPTORS, useClass: RetryInterceptor, multi: true },
  { provide: HTTP_INTERCEPTORS, useClass: AuthHttpInterceptor, multi: true },
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
  AuthModule.forRoot({
    domain: environment.auth0.domain,
    clientId: environment.auth0.clientId,
    authorizationParams: {
      redirect_uri: window.location.origin,
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
  }),
  ServiceWorkerModule.register('ngsw-worker.js', {
    enabled: !isDevMode(),
    // Register the ServiceWorker as soon as the application is stable
    // or after 30 seconds (whichever comes first).
    registrationStrategy: 'registerWhenStable:30000',
  }),
  RouterModule.forRoot(appRoutes, {
    enableTracing: isDevMode(),
  }),
].map((mod) => importProvidersFrom(mod));

bootstrapApplication(AppComponent, {
  providers: [
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
}).catch((e) => console.error(e));
