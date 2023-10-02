import { NgOptimizedImage, registerLocaleData } from '@angular/common';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import en from '@angular/common/locales/en';
import { NgModule, isDevMode } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { TitleStrategy } from '@angular/router';
import { ServiceWorkerModule } from '@angular/service-worker';
import { AuthHttpInterceptor, AuthModule } from '@auth0/auth0-angular';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NZ_CONFIG, NzConfig } from 'ng-zorro-antd/core/config';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NZ_I18N, en_US } from 'ng-zorro-antd/i18n';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzNotificationModule } from 'ng-zorro-antd/notification';
import { NzPopoverModule } from 'ng-zorro-antd/popover';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzResultModule } from 'ng-zorro-antd/result';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { ImageCropperModule } from 'ngx-image-cropper';
import { NgxMapboxGLModule } from 'ngx-mapbox-gl';
import { environment } from 'src/environments/environment';
import { ActivityService } from './activity.service';
import { AddressComponent } from './address/address.component';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ArtFormsService } from './art-forms.service';
import { AuthorizeComponent } from './authorize/authorize.component';
import { AvatarComponent } from './avatar/avatar.component';
import { BrowserStorageService } from './browser-storage.service';
import { CoverImageComponent } from './cover-image/cover-image.component';
import { CursorComponent } from './cursor/cursor.component';
import { ErrorInterceptor } from './error.interceptor';
import { FatalErrorComponent } from './fatal-error/fatal-error.component';
import { FlagPinComponent } from './flag-pin/flag-pin.component';
import { HeaderComponent } from './header/header.component';
import { LocationService } from './location.service';
import { MapAsideComponent } from './map-aside/map-aside.component';
import { MapLayoutComponent } from './map-layout/map-layout.component';
import { MapComponent } from './map/map.component';
import { PageLayoutComponent } from './page-layout/page-layout.component';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';
import { PinEditorComponent } from './pin-editor/pin-editor.component';
import { PinComponent } from './pin/pin.component';
import { PointsService } from './points.service';
import { RetryInterceptor } from './retry.interceptor';
import { TemplatePageTitleStrategy } from './title.strategy';
import { UserAccountComponent } from './user-account/user-account.component';
import { UserProfileComponent } from './user-profile/user-profile.component';
import { ZoomSyncService } from './zoom-sync.service';
import { CoverEditorComponent } from './cover-editor/cover-editor.component';
import { UserService } from './user.service';
import { FeedbackComponent } from './feedback/feedback.component';
import { PinCardComponent } from './pin-card/pin-card.component';
import { WelcomeComponent } from './welcome/welcome.component';

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
  declarations: [
    AppComponent,
    PageNotFoundComponent,
    PinComponent,
    PinEditorComponent,
    MapComponent,
    MapAsideComponent,
    MapLayoutComponent,
    AddressComponent,
    FlagPinComponent,
    CursorComponent,
    HeaderComponent,
    PageLayoutComponent,
    UserProfileComponent,
    UserAccountComponent,
    FatalErrorComponent,
    CoverImageComponent,
    AvatarComponent,
    AuthorizeComponent,
    CoverEditorComponent,
    FeedbackComponent,
    PinCardComponent,
    WelcomeComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
    NgOptimizedImage,
    NgxMapboxGLModule.withConfig({
      accessToken: environment.mapBoxTokenRead,
    }),
    NzButtonModule,
    NzDrawerModule,
    NzIconModule,
    NzInputModule,
    NzFormModule,
    NzTypographyModule,
    NzUploadModule,
    NzSelectModule,
    NzDividerModule,
    NzPopoverModule,
    NzAlertModule,
    NzGridModule,
    NzNotificationModule,
    NzSkeletonModule,
    NzSpaceModule,
    NzTagModule,
    NzResultModule,
    NzModalModule,
    NzDropDownModule,
    NzRadioModule,
    NzToolTipModule,
    NzSpinModule,
    NzCardModule,
    NzLayoutModule,
    NzAvatarModule,
    ImageCropperModule,
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
    httpInterceptorProviders,
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
