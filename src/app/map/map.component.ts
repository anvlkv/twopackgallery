import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  HostListener,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import type { JSONData } from '@xata.io/client';
import {
  ErrorEvent,
  EventData,
  MapLayerMouseEvent,
  MapboxEvent,
} from 'mapbox-gl';
import {
  MapComponent as MglMapComponent,
  NgxMapboxGLModule,
} from 'ngx-mapbox-gl';
import {
  BehaviorSubject,
  Subject,
  Subscription,
  combineLatest,
  filter,
  map,
  take,
} from 'rxjs';
import { environment } from 'src/environments/environment';
import type { PointsRecord } from 'xata';
import { AvatarComponent } from '../avatar/avatar.component';
import { CursorComponent } from '../cursor/cursor.component';
import { LocationService } from '../location.service';
import { PointsService } from '../points.service';
import { ZoomSyncService } from '../zoom-sync.service';
import {
  NzNotificationModule,
  NzNotificationService,
} from 'ng-zorro-antd/notification';
import { BrowserStorageService } from '../browser-storage.service';
import deepEqual from 'deep-equal';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';

type MapChangeEvent = MapboxEvent<
  MouseEvent | TouchEvent | WheelEvent | undefined
> &
  EventData;

const LAST_USED_KEY = 'mapLocation, zoom';
const LOCATION_CONSENT_KEY = 'locationPermission';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    NzNotificationModule,
    NzModalModule,
    NgxMapboxGLModule,
    CursorComponent,
    AvatarComponent,
  ],
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
})
export class MapComponent implements OnInit, OnDestroy, AfterViewInit {
  center?: [number, number];
  cursor?: [number, number];
  userLocation?: [number, number];
  subs: Subscription[] = [];
  zoom?: number;
  accessToken = environment.mapBoxTokenRead;
  hint?: string;

  private points = new Map<string, Partial<JSONData<PointsRecord>>>();

  private geoJsonPoints$ = new BehaviorSubject<GeoJSON.FeatureCollection>({
    type: 'FeatureCollection',
    features: [],
  });

  geoJsonPoints = this.geoJsonPoints$.asObservable();

  cursorStyle?: string;

  private _offset?: number;
  @Input('offset')
  set offset(val: number | undefined) {
    this._offset = val;
    if (!this.loading$.map.getValue()) {
      this.applyMapPadding();
    }
  }
  get offset(): number {
    return this._offset || 0;
  }

  @ViewChild('mapRef', { read: MglMapComponent })
  mapRef!: MglMapComponent;

  @HostListener('window:focus', ['$event'])
  handleFocusEvent() {
    this.loading$.focus.next(false);
  }

  loading$ = {
    location: new BehaviorSubject(true),
    points: new BehaviorSubject(true),
    map: new BehaviorSubject(true),
    focus: new BehaviorSubject(true),
  };

  locationConsent = new BehaviorSubject(
    this.storage.get<{ consent: 'accept' | 'deny' }>(LOCATION_CONSENT_KEY)
  );

  loading = combineLatest(this.loading$).pipe(
    map((subjects) => Object.values(subjects).some(Boolean))
  );

  constructor(
    private pts: PointsService,
    private location: LocationService,
    private router: Router,
    private zoomSync: ZoomSyncService,
    private notification: NzNotificationService,
    private storage: BrowserStorageService,
    private modal: NzModalService
  ) {}

  ngOnInit(): void {
    
    if (!this.storage.get(LOCATION_CONSENT_KEY)) {
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
      consent$.subscribe((value) => {
        this.storage.set(LOCATION_CONSENT_KEY, {
          consent: value ? 'accept' : 'deny',
        });
        this.locationConsent.next(this.storage.get(LOCATION_CONSENT_KEY));
        if (!value) {
          this.loading$.location.next(false);
        }
      });
    }

    this.subs.push(
      this.location.currentLocation.pipe(take(1)).subscribe(() => {
        if (this.zoom === undefined) {
          this.zoomSync.setZoom(15);
        }
      })
    );

    this.subs.push(
      this.location.currentLocation.subscribe((loc) => {
        this.cursor = loc;
        if (!deepEqual(this.mapRef.mapInstance.getCenter(), loc)) {
          this.center = loc;
        }
        this.loading$.location.next(false);
      })
    );

    this.subs.push(
      this.location.currentBounds.subscribe(() => {
        this.loading$.points.next(true);
      })
    );

    this.subs.push(
      this.pts.getPointsInBounds(this.points).subscribe({
        next: (points) => {
          points.forEach((point) => {
            this.points.set(point.id, point);
          });
          this.nextPoints();
          this.loading$.points.next(false);
        },
        error: (err) => {
          this.notification.error('Something went wrong...', err.message);
        },
      })
    );

    this.subs.push(
      this.pts.deletedPoints.subscribe((deleted) => {
        deleted.forEach((id) => this.points.delete(id));
        this.nextPoints();
      })
    );

    this.subs.push(
      this.pts.createdPoint.subscribe((point) => {
        this.points.set(point.id, point);
        this.nextPoints();
      })
    );

    this.subs.push(
      this.zoomSync.zoom.subscribe(({ value }) => (this.zoom = value))
    );

    this.subs.push(
      this.location.runningLocation.subscribe(
        (value) => (this.userLocation = value)
      )
    );

    this.subs.push(
      combineLatest({
        map: this.loading$.map,
        focus: this.loading$.focus,
        consent: this.locationConsent,
      })
        .pipe(
          filter(
            ({ map, focus, consent }) =>
              !map && !focus && !this.center && consent?.consent === 'accept'
          )
        )
        .subscribe(() => {
          this.location.locate(false);
          this.location.startTrackingLocation();
        })
    );

    // TODO: show hints
    // this.subs.push(
    //   combineLatest({
    //     bounds: this.location.currentBounds,
    //     points: this.geoJsonPoints,
    //   }).subscribe(({ bounds: [minLon, minLat, maxLon, maxLat] }) => {
    //     const pinsInArea =
    //       this.mapLoaded &&
    //       this.mapRef.mapInstance.isSourceLoaded('allPins') &&
    //       this.mapRef.mapInstance.queryRenderedFeatures(
    //         [
    //           [minLon, minLat],
    //           [maxLon, maxLat],
    //         ],
    //         {
    //           layers: ['pinsLayer'],
    //         }
    //       );

    //   })
    // );
  }

  ngAfterViewInit(): void {
    if (document.hasFocus()) {
      this.loading$.focus.next(false);
    }
  }

  private nextPoints() {
    this.geoJsonPoints$.next({
      type: 'FeatureCollection',
      features: Array.from(this.points.values()).map(
        (point) =>
          ({
            type: 'Feature',
            id: point.id,
            geometry: {
              type: 'Point',
              coordinates: [point.longitude, point.latitude],
            },
            properties: {
              id: point.id,
              title: point.title,
              // TODO: add art forms
            },
          } as GeoJSON.Feature)
      ),
    });
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
    this.location.stopTrackingLocation();
    this.storage.set(LAST_USED_KEY, { center: this.center, zoom: this.zoom });
  }

  mapLoad() {
    this.loading$.map.next(false);
    this.location.adjust_bounds(this.mapRef.mapInstance.getBounds().toArray());
    if (this.offset) {
      this.applyMapPadding();
    }
  }

  mapMove(ev: MapChangeEvent, final = true) {
    if (!this.loading$.map.getValue() && this.center) {
      const nextCenter = this.mapRef.mapInstance.getCenter();
      if (final) {
        this.location.adjust_location([nextCenter.lng, nextCenter.lat]);
        this.location.adjust_bounds(
          this.mapRef.mapInstance.getBounds().toArray()
        );
      } else {
        this.cursor = [nextCenter.lng, nextCenter.lat];
      }
    }
  }

  mapZoom(ev: MapChangeEvent, final = true) {
    if (!this.loading$.map.getValue()) {
      if (ev.originalEvent) {
        const nextZoom = this.mapRef.mapInstance.getZoom();
        this.zoomSync.setZoom(nextZoom);
      }
      if (final) {
        this.location.adjust_bounds(
          this.mapRef.mapInstance.getBounds().toArray()
        );
      }
    }
  }

  clickPins(ev: MapLayerMouseEvent) {
    if (ev.features) {
      if (ev.features[0].properties!['cluster'] === true) {
        this.zoomSync.zoomIn();
      } else {
        this.router.navigate(['map', 'pin', ev.features[0].properties!['id']]);
      }
    }
  }

  onMouseMoveMap(ev: MapLayerMouseEvent) {
    const hasPin =
      !this.loading$.map.getValue() &&
      this.mapRef.mapInstance.isSourceLoaded('allPins') &&
      this.mapRef.mapInstance.queryRenderedFeatures(ev.point, {
        layers: ['pinsLayer'],
      }).length > 0;
    if (hasPin) {
      this.cursorStyle = 'pointer';
    } else if (this.cursorStyle !== 'grab') {
      this.cursorStyle = 'grab';
    }
  }

  onMapBoxError(ev: ErrorEvent & EventData) {
    this.router.navigate(['/', 'error'], {
      state: { error: ev.error.message, url: window.location.toString() },
    });
  }

  private applyMapPadding() {
    this.mapRef?.mapInstance.setPadding({
      right: this.offset,
      left: 0,
      top: 0,
      bottom: 0,
    });
    this.center && this.mapRef?.mapInstance.setCenter(this.center);
  }
}
