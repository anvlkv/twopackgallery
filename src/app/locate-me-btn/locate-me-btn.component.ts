import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import {
  BehaviorSubject,
  Subject,
  Subscription,
  filter,
  map,
  of,
  skip,
  switchMap,
  take,
  tap,
} from 'rxjs';
import { BrowserStorageService } from '../browser-storage.service';
import { LocationService } from '../location.service';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { ZoomSyncService } from '../zoom-sync.service';
import {
  NzNotificationModule,
  NzNotificationService,
} from 'ng-zorro-antd/notification';

export const LOCATION_CONSENT_KEY = 'locationPermission';
export type Consent = { consent: 'accept' | 'deny' };

@Component({
  selector: 'app-locate-me-btn',
  standalone: true,
  imports: [
    CommonModule,
    NzModalModule,
    NzButtonModule,
    NzIconModule,
    NzToolTipModule,
    NzNotificationModule,
  ],
  templateUrl: './locate-me-btn.component.html',
  styleUrls: ['./locate-me-btn.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LocateMeBtnComponent implements OnInit, OnDestroy {
  locationConsent = new BehaviorSubject(
    this.storage.get<Consent>(LOCATION_CONSENT_KEY)
  );

  locating = false;

  subs: Subscription[] = [];

  constructor(
    private storage: BrowserStorageService,
    private modal: NzModalService,
    private location: LocationService,
    private notification: NzNotificationService,
    private ch: ChangeDetectorRef,
    private zoomSync: ZoomSyncService,
  ) {}

  ngOnInit(): void {
    this.subs.push(
      this.locationConsent
        .pipe(filter((consent) => consent?.consent === 'accept'))
        .subscribe(() => {
          this.location.startTrackingLocation();
        })
    );
  }

  ngOnDestroy(): void {
    this.location.stopTrackingLocation();
  }

  handleAim(ev: MouseEvent) {
    this.locating = true;

    this.subs.push(
      this.checkConsent()
        .pipe(
          switchMap((consent) => {
            if (consent) {
              return this.location.locate();
            } else {
              return of(null);
            }
          })
        )
        .subscribe({
          next: () => {
            this.locating = false;
            if (this.zoomSync.getZoom() < 13) {
              this.zoomSync.setZoom(13);
            }
            else {
              this.ch.detectChanges();
            }
          },
          error: () => {
            this.locating = false;
            this.notification.error(
              'Could not locate you',
              'Please try again an check if you allowed accessing your location'
            );
            this.storage.remove(LOCATION_CONSENT_KEY);
            this.locationConsent.next(undefined);
            this.ch.detectChanges();
          },
        })
    );

    this.ch.detectChanges();
    return false;
  }

  checkConsent() {
    if (this.locationConsent.getValue()?.consent !== 'accept') {
      const consent$ = new Subject<boolean>();
      this.modal.confirm({
        nzTitle: 'Please allow using your geo location',
        nzContent: `To make your experience of using the map more convenient we would like to use your device geo location.
         After clicking "Yes" you'll be additionally prompted by your browser, please click "Allow" in the browser dialog.
         Please note we won't store your location data unless you are adding a new pin.`,
        nzOnOk: () => consent$.next(true),
        nzOnCancel: () => consent$.next(false),
        nzOkText: 'Yes',
        nzCancelText: 'No',
        nzIconType: 'aim',
        nzBodyStyle: {
          'white-space': 'pre-line',
        },
      });

      return consent$.pipe(
        tap((value) => {
          this.storage.set<Consent>(LOCATION_CONSENT_KEY, {
            consent: value ? 'accept' : 'deny',
          });
          this.locationConsent.next(this.storage.get(LOCATION_CONSENT_KEY));
        })
      );
    } else {
      return of(true);
    }
  }
}
