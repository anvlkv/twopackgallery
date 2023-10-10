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
import {
  AimOutline,
  CheckCircleOutline,
  CloseOutline,
  CompassTwoTone,
  EditOutline,
  EnterOutline,
  EnvironmentOutline,
  EyeOutline,
  EyeTwoTone,
  FlagOutline,
  FlagTwoTone,
  GlobalOutline,
  MinusOutline,
  PlusOutline,
  PushpinOutline,
  PushpinTwoTone,
  RedoOutline,
  SearchOutline,
  SelectOutline,
  UpOutline,
  UserOutline,
} from '@ant-design/icons-angular/icons';
import { NZ_CONFIG, NzConfig } from 'ng-zorro-antd/core/config';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NZ_I18N, en_US } from 'ng-zorro-antd/i18n';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzNotificationModule } from 'ng-zorro-antd/notification';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { xataImageLoader } from '../xata.imageloader';
import { BreakPointService } from './break-point.service';
import { BrowserStorageService } from './browser-storage.service';
import { ErrorInterceptor } from './error.interceptor';
import { RetryInterceptor } from './retry.interceptor';
import { TemplatePageTitleStrategy } from './title.strategy';
import { UserService } from './user.service';

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

const icons = [
  AimOutline,
  CheckCircleOutline,
  CloseOutline,
  CompassTwoTone,
  EditOutline,
  EnterOutline,
  EnvironmentOutline,
  EyeOutline,
  EyeTwoTone,
  FlagOutline,
  FlagTwoTone,
  GlobalOutline,
  MinusOutline,
  PlusOutline,
  PushpinOutline,
  PushpinTwoTone,
  RedoOutline,
  SearchOutline,
  SelectOutline,
  UpOutline,
  UserOutline,
];

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
    scope: './',
  }),
  NzIconModule.forRoot(icons),
].map((mod) => importProvidersFrom(mod));

export const appConfig: ApplicationConfig = {
  providers: [
    provideClientHydration(),
    BrowserStorageService,
    UserService,
    BreakPointService,
    { provide: NZ_CONFIG, useValue: ngZorroConfig },
    { provide: NZ_I18N, useValue: en_US },
    { provide: TitleStrategy, useClass: TemplatePageTitleStrategy },
    { provide: IMAGE_LOADER, useValue: xataImageLoader },
    httpInterceptorProviders,
    ...providersFrom,
  ],
};
