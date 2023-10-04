import { CommonModule, DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  Component,
  HostListener,
  Inject,
  Input,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  ViewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import type { JSONData } from '@xata.io/client';
import deepEqual from 'deep-equal';
import {
  ErrorEvent,
  EventData,
  FlyToOptions,
  LngLat,
  LngLatBounds,
  MapLayerMouseEvent,
  MapboxEvent,
} from 'mapbox-gl';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import {
  NzNotificationModule,
  NzNotificationService,
} from 'ng-zorro-antd/notification';
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
  skipWhile,
  takeWhile,
} from 'rxjs';
import { environment } from 'src/environments/environment';
import type { PointsRecord } from 'xata';
import { ActivityService, EActivity } from '../activity.service';
import { AvatarComponent } from '../avatar/avatar.component';
import { BrowserStorageService } from '../browser-storage.service';
import { CursorComponent, NO_HINTS_KEY } from '../cursor/cursor.component';
import { LocationService } from '../location.service';
import { PointsService } from '../points.service';
import { ZoomSyncService } from '../zoom-sync.service';

type MapChangeEvent = MapboxEvent<
  MouseEvent | TouchEvent | WheelEvent | undefined
> &
  EventData;

const LAST_USED_KEY = 'mapLocation, zoom';

export const LOCATION_CONSENT_KEY = 'locationPermission';
export type Consent = { consent: 'accept' | 'deny' };
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
  accessToken = environment.mapBoxTokenRead;
  cursor?: [number, number];
  subs: Subscription[] = [];
  hint?: string;
  initialZoom: [number] = [0.1];
  userLocation?: [number, number];
  hasInitializedZoom = false;
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
    this.storage.get<Consent>(LOCATION_CONSENT_KEY)
  );

  loading = combineLatest(this.loading$).pipe(
    map((subjects) => Object.values(subjects).some(Boolean))
  );

  isBrowser = isPlatformBrowser(this.platformId);

  constructor(
    private pts: PointsService,
    private location: LocationService,
    private router: Router,
    private zoomSync: ZoomSyncService,
    private notification: NzNotificationService,
    private storage: BrowserStorageService,
    private modal: NzModalService,
    private activity: ActivityService,
    @Inject(DOCUMENT) public document: Document,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      if (!this.document.hasFocus()) {
        window.focus();
      }
    } else {
      return;
    }

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
        this.storage.set<Consent>(LOCATION_CONSENT_KEY, {
          consent: value ? 'accept' : 'deny',
        });
        this.locationConsent.next(this.storage.get(LOCATION_CONSENT_KEY));
        if (!value) {
          this.loading$.location.next(false);
        }
      });
    }

    this.subs.push(
      combineLatest({
        map: this.loading$.map,
        location: this.location.currentLocation,
      })
        .pipe(skipWhile(({ map }) => map))
        .subscribe(({ location }) => {
          this.loading$.location.next(false);
          this.cursor = location;
          const center = this.mapRef.mapInstance.getCenter();
          if (!deepEqual(center.toArray(), location)) {
            const options: FlyToOptions = { center: location };
            if (!this.hasInitializedZoom) {
              options.zoom = 13;
              this.hasInitializedZoom = true;
              this.zoomSync.setZoom(options.zoom);
            }
            this.mapRef.mapInstance.flyTo(options);
          }
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
      combineLatest({
        map: this.loading$.map,
        zoom: this.zoomSync.zoom,
      })
        .pipe(skipWhile(({ map }) => map))
        .subscribe(({ zoom: { value } }) => {
          this.mapRef.mapInstance.zoomTo(value, { duration: 700 });
        })
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
              !map && !focus && !this.cursor && consent?.consent === 'accept'
          )
        )
        .subscribe(() => {
          this.location.locate(false);
          this.location.startTrackingLocation();
        })
    );

    this.subs.push(
      combineLatest({
        bounds: this.location.currentBounds,
        points: this.geoJsonPoints,
        loading: this.loading,
        activity: this.activity.activity,
      })
        .pipe(
          takeWhile(() => !this.storage.get(NO_HINTS_KEY)),
          skipWhile(({ loading }) => loading),
          skipWhile(() => !this.mapRef.mapInstance.isSourceLoaded('allPins')),
          map(({ bounds: [minLng, minLat, maxLng, maxLat], activity }) => {
            switch (activity) {
              case EActivity.ViewPin: {
                return;
              }
              case EActivity.PinNew:
              case EActivity.EditPin: {
                return `Drag the map to adjust the geo position of this location`;
              }
              case EActivity.FlagPin: {
                return `You're about to flag this location`;
              }
              default: {
                const sw = new LngLat(minLng, minLat);
                const ne = new LngLat(maxLng, maxLat);
                const box = new LngLatBounds(sw, ne);

                const hasPoints = Array.from(this.points.values()).some((p) =>
                  box.contains([p.longitude, p.latitude] as [number, number])
                );

                if (!hasPoints) {
                  return `There isn't much in this area. Consider adding your art location or exploring further`;
                } else {
                  return;
                }
              }
            }
          })
        )
        .subscribe((hint) => (this.hint = hint))
    );
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      if (this.document.hasFocus()) {
        this.loading$.focus.next(false);
      }
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
    this.storage.set(LAST_USED_KEY, {
      center: this.cursor,
      zoom: this.zoomSync.getZoom(),
    });
  }

  mapLoad() {
    this.loading$.map.next(false);
    this.location.adjust_bounds(this.mapRef.mapInstance.getBounds().toArray());
    if (this.offset) {
      this.applyMapPadding();
    }
  }

  mapMove(ev: MapChangeEvent, final = true) {
    if (
      [EActivity.ViewPin, EActivity.FlagPin].includes(this.activity.current())
    ) {
      return;
    }

    if (!this.loading$.map.getValue() && this.cursor) {
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
      const nextZoom = this.mapRef.mapInstance.getZoom();
      if (ev.originalEvent && final) {
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
    this.cursor && this.mapRef?.mapInstance.setCenter(this.cursor);
  }
}
