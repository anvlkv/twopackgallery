import { Component, OnDestroy, OnInit, isDevMode } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { BrowserStorageService } from './browser-storage.service';
import { AuthModule, AuthService } from '@auth0/auth0-angular';
import { Subscription } from 'rxjs';
import {
  NzNotificationRef,
  NzNotificationService,
} from 'ng-zorro-antd/notification';
import { HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ServiceWorkerModule } from '@angular/service-worker';

const COOKIE_CONSENT = 'hasGivenCookieConsent';
@Component({
  standalone: true,
  imports: [
    RouterModule,
    HttpClientModule,
    AuthModule,
    ServiceWorkerModule
  ],
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'twopack.gallery';
  subs: Subscription[] = [];

  constructor(
    private auth: AuthService,
    private notification: NzNotificationService,
    private storage: BrowserStorageService
  ) {}

  notificationRef?: NzNotificationRef;
  ngOnInit(): void {
    this.subs.push(
      this.auth.error$.subscribe((err) => {
        if (this.notificationRef) {
          this.notification.remove(this.notificationRef.messageId);
        }
        this.notificationRef = this.notification.warning(
          'One more thing...',
          err.message,
          { nzDuration: 0 }
        );
      })
    );

    if (!this.storage.get(COOKIE_CONSENT)) {
      this.notification
        .info('Cookies...', 'We use 3rd-party cookies for authentication.', {
          nzDuration: 0,
          nzPlacement: 'bottomLeft',
          nzCloseIcon: 'check-circle',
        })
        .onClose.subscribe(() => {
          this.storage.set(COOKIE_CONSENT, true);
        });
    }
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
  }
}
