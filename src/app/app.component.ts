import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BrowserStorageService } from './browser-storage.service';
import { AuthService } from '@auth0/auth0-angular';
import { Subscription } from 'rxjs';
import {
  NzNotificationRef,
  NzNotificationService,
} from 'ng-zorro-antd/notification';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'twopack.gallery';
  subs: Subscription[] = [];

  constructor(
    private auth: AuthService,
    private notification: NzNotificationService
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
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
  }
}
