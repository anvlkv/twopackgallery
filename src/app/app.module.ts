import { IMAGE_LOADER, registerLocaleData } from '@angular/common';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import en from '@angular/common/locales/en';
import { NgModule, isDevMode } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { TitleStrategy } from '@angular/router';
import { ServiceWorkerModule } from '@angular/service-worker';
import { AuthHttpInterceptor, AuthModule } from '@auth0/auth0-angular';
import { NZ_CONFIG, NzConfig } from 'ng-zorro-antd/core/config';
import { NZ_I18N, en_US } from 'ng-zorro-antd/i18n';
import { environment } from 'src/environments/environment';
import { ActivityService } from './activity.service';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ArtFormsService } from './art-forms.service';
import { BrowserStorageService } from './browser-storage.service';
import { ErrorInterceptor } from './error.interceptor';
import { LocationService } from './location.service';
import { PointsService } from './points.service';
import { RetryInterceptor } from './retry.interceptor';
import { TemplatePageTitleStrategy } from './title.strategy';
import { UserService } from './user.service';
import { ZoomSyncService } from './zoom-sync.service';
import { xataImageLoader } from 'src/xata.imageloader';
import { MiniMapComponent } from './mini-map/mini-map.component';

registerLocaleData(en);

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

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    BrowserAnimationsModule,
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
  ],
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
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
