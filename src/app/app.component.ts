import { isPlatformBrowser } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import {
  AfterViewInit,
  Component,
  Inject,
  OnDestroy,
  PLATFORM_ID,
  TemplateRef,
  ViewChild
} from '@angular/core';
import { RouterModule } from '@angular/router';
import { ServiceWorkerModule } from '@angular/service-worker';
import { AuthModule } from '@auth0/auth0-angular';
import { NzButtonModule } from 'ng-zorro-antd/button';
import {
  NzNotificationRef,
  NzNotificationService,
} from 'ng-zorro-antd/notification';
import { Subscription } from 'rxjs';
import { BrowserStorageService } from './browser-storage.service';
import { BreakPointComponent } from './break-point/break-point.component';

const COOKIE_CONSENT = 'hasGivenCookieConsent';
@Component({
  standalone: true,
  imports: [
    RouterModule,
    HttpClientModule,
    AuthModule,
    ServiceWorkerModule,
    NzButtonModule,
    BreakPointComponent
  ],
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnDestroy, AfterViewInit {
  title = 'twopack.gallery';
  subs: Subscription[] = [];

  constructor(
    private notification: NzNotificationService,
    private storage: BrowserStorageService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  notificationRef?: NzNotificationRef;

  @ViewChild('okCookie')
  okCookie!: TemplateRef<any>;

  ngAfterViewInit(): void {
    if (
      !this.storage.get(COOKIE_CONSENT) &&
      isPlatformBrowser(this.platformId)
    ) {
      this.subs.push(
        this.notification
          .info('Cookies...', 'We use 3rd-party cookies for authentication.', {
            nzDuration: 0,
            nzPlacement: 'bottomLeft',
            nzCloseIcon: this.okCookie,
          })
          .onClose.subscribe(() => {
            this.storage.set(COOKIE_CONSENT, true);
          })
      );
    }
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
  }
}
