import { CommonModule, Location, isPlatformBrowser } from '@angular/common';
import { HttpParams } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Inject,
  Input,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  ViewChild,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
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
  Subscription,
  combineLatest,
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

const LAST_USED_MAP_VIEW_KEY = 'mapLocation, zoom';
type LastUsedMapView = {
  center?: [number, number];
  zoom?: number;
};

@Component({
  standalone: true,
  imports: [
    CommonModule,
    NzNotificationModule,
    NgxMapboxGLModule,
    CursorComponent,
    AvatarComponent,
  ],
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapComponent implements OnInit, OnDestroy {
  accessToken = environment.mapBoxTokenRead;
  cursor?: [number, number];
  subs: Subscription[] = [];
  hint?: string;
  initialZoom: [number] = [0.1];
  userLocation?: [number, number];
  hasInitializedZoom = false;

  private geoJsonPoints$ = new BehaviorSubject<GeoJSON.FeatureCollection>({
    type: 'FeatureCollection',
    features: [],
  });

  geoJsonPoints = this.geoJsonPoints$.asObservable();

  initialCenter?: [number, number];
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

  loading$ = {
    points: new BehaviorSubject(true),
    map: new BehaviorSubject(true),
  };

  loading = combineLatest(this.loading$).pipe(
    map((subjects) => Object.values(subjects).some(Boolean))
  );

  isBrowser = isPlatformBrowser(this.platformId);

  constructor(
    private pts: PointsService,
    private location: LocationService,
    private browserLocation: Location,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private zoomSync: ZoomSyncService,
    private notification: NzNotificationService,
    private storage: BrowserStorageService,
    private activity: ActivityService,
    private ch: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    const query = activatedRoute.snapshot.queryParams;

    const restoreMapView =
      this.storage.get<LastUsedMapView>(LAST_USED_MAP_VIEW_KEY) || {};

    try {
      if (query['lng'] && query['lat']) {
        const lngLat: [number, number] = [
          parseFloat(query['lng']),
          parseFloat(query['lat']),
        ];
        if (lngLat.every((v) => !isNaN(v))) {
          restoreMapView.center = lngLat;
        } else {
          throw 'Invalid url coords';
        }
      }
    } catch {
      this.router.navigate([], {
        queryParams: { lng: null, lat: null },
        replaceUrl: true,
        queryParamsHandling: 'merge',
        relativeTo: this.activatedRoute,
      });
    }
    try {
      if (query['zm']) {
        const zoom = parseFloat(query['zm']);
        if (!isNaN(zoom)) {
          restoreMapView.zoom = zoom;
        } else {
          throw 'Invalid url zoom';
        }
      }
    } catch {
      this.router.navigate([], {
        queryParams: { zm: null },
        replaceUrl: true,
        queryParamsHandling: 'merge',
        relativeTo: this.activatedRoute,
      });
    }

    if (restoreMapView.center) {
      this.initialCenter = this.cursor = restoreMapView.center;
      this.location.adjust_location(restoreMapView.center);
    }
    if (restoreMapView.zoom) {
      this.initialZoom = [restoreMapView.zoom];
      this.zoomSync.setZoom(restoreMapView.zoom);
    }
  }

  ngOnInit(): void {
    this.subs.push(
      combineLatest({
        mapLoading: this.loading$.map,
        location: this.location.currentLocation,
        activity: this.activity.activity,
      })
        .pipe(skipWhile(({ mapLoading }) => mapLoading))
        .subscribe(({ location, activity }) => {
          this.cursor = location;

          const { lng, lat } = this.mapRef.mapInstance.getCenter();

          const options: FlyToOptions = {
            center: location,
            zoom: this.zoomSync.getZoom() || 13,
          };

          if (!deepEqual(options.center, [lng, lat])) {
            this.mapRef.mapInstance.flyTo(options);
          }

          if (
            [EActivity.CreatePin, EActivity.EditPin, EActivity.None].includes(
              activity
            )
          ) {
            this.updateUrlMapView({ center: location });
          } else {
            this.clearUrlMapView();
          }
          this.updateStorageMapView({ center: location });

          this.ch.detectChanges();
        })
    );

    this.subs.push(
      this.location.currentBounds.subscribe(() => {
        this.loading$.points.next(true);
        this.ch.detectChanges();
      })
    );

    this.subs.push(
      this.pts.pointsInBounds().subscribe({
        next: (points) => {
          this.nextPoints(points);
          this.loading$.points.next(false);
          this.ch.detectChanges();
        },
        error: (err) => {
          this.loading$.points.next(false);
          this.notification.error('Something went wrong...', err.message);
        },
      })
    );


    this.subs.push(
      combineLatest({
        mapLoading: this.loading$.map,
        zoom: this.zoomSync.zoom,
        activity: this.activity.activity,
      })
        .pipe(skipWhile(({ mapLoading }) => mapLoading))
        .subscribe(({ zoom: { value }, activity }) => {
          this.mapRef.mapInstance.zoomTo(value, { duration: 700 });
          if (
            [EActivity.CreatePin, EActivity.EditPin, EActivity.None].includes(
              activity
            )
          ) {
            this.updateUrlMapView({ zoom: value });
          } else {
            this.clearUrlMapView();
          }
          this.updateStorageMapView({ zoom: value });

          this.ch.detectChanges();
        })
    );

    this.subs.push(
      this.location.runningLocation.subscribe((value) => {
        this.userLocation = value;
        this.ch.detectChanges();
      })
    );

    // this.subs.push(
    //   combineLatest({
    //     bounds: this.location.currentBounds,
    //     points: this.geoJsonPoints,
    //     loading: this.loading,
    //     activity: this.activity.activity,
    //   })
    //     .pipe(
    //       takeWhile(() => !this.storage.get(NO_HINTS_KEY)),
    //       skipWhile(({ loading }) => loading),
    //       skipWhile(() => !this.mapRef.mapInstance.isSourceLoaded('allPins')),
    //       map(({ bounds: [minLng, minLat, maxLng, maxLat], activity }) => {
    //         switch (activity) {
    //           case EActivity.ViewPin: {
    //             return;
    //           }
    //           case EActivity.CreatePin:
    //           case EActivity.EditPin: {
    //             return `Drag the map to adjust the geo position of this location`;
    //           }
    //           case EActivity.FlagPin: {
    //             return `You're about to flag this location`;
    //           }
    //           default: {
    //             const sw = new LngLat(minLng, minLat);
    //             const ne = new LngLat(maxLng, maxLat);
    //             const box = new LngLatBounds(sw, ne);

    //             const hasPoints = Array.from(this.points.values()).some((p) =>
    //               box.contains([p.longitude, p.latitude] as [number, number])
    //             );

    //             if (!hasPoints) {
    //               return `There isn't much in this area. Consider adding your art location or exploring further`;
    //             } else {
    //               return;
    //             }
    //           }
    //         }
    //       })
    //     )
    //     .subscribe((hint) => {
    //       this.hint = hint;
    //       this.ch.detectChanges();
    //     })
    // );
  }

  private nextPoints(points: JSONData<PointsRecord>[]) {
    this.geoJsonPoints$.next({
      type: 'FeatureCollection',
      features: points.map(
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

  private updateStorageMapView({
    center = this.cursor,
    zoom = this.zoomSync.getZoom(),
  }: LastUsedMapView) {
    this.storage.set<LastUsedMapView>(LAST_USED_MAP_VIEW_KEY, { center, zoom });
  }
  private updateUrlMapView({
    center = this.cursor,
    zoom = this.zoomSync.getZoom(),
  }: LastUsedMapView) {
    let params = new HttpParams();
    if (center) {
      params = params.set('lng', center[0]).set('lat', center[1]);
    }
    if (zoom) {
      params = params.set('zm', zoom);
    }
    const path = this.browserLocation.path().split('?')[0];
    this.browserLocation.replaceState(path, params.toString());
  }
  private clearUrlMapView() {
    const path = this.browserLocation.path().split('?')[0];
    this.browserLocation.replaceState(path);
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
    this.location.stopTrackingLocation();
    this.clearUrlMapView();
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
      [EActivity.ViewPin, EActivity.FlagPin, EActivity.CreatePinLocked].includes(this.activity.current())
    ) {
      return;
    }

    if (!this.loading$.map.getValue()) {
      const nextCenter = this.mapRef.mapInstance.getCenter();
      if (final && !ev['isPaddingChange']) {
        this.location.adjust_bounds(
          this.mapRef.mapInstance.getBounds().toArray()
        );

        this.location.adjust_location([nextCenter.lng, nextCenter.lat]);
      }
      this.cursor = [nextCenter.lng, nextCenter.lat];
    }
  }

  mapZoom(ev: MapChangeEvent, final = true) {
    if (!this.loading$.map.getValue()) {
      const nextZoom = this.mapRef.mapInstance.getZoom();
      if (final) {
        this.zoomSync.setZoom(nextZoom);
        this.location.adjust_bounds(
          this.mapRef.mapInstance.getBounds().toArray()
        );
      }
    }
  }

  clickPins(ev: MapLayerMouseEvent) {
    if (ev.features) {
      if (ev.features[0].properties!['cluster'] === true) {
        this.mapRef.mapInstance.flyTo({
          center: ev.lngLat,
          zoom: this.zoomSync.getZoom()! + 1,
        });
      } else {
        this.router.navigate(['map', 'pin', ev.features[0].properties!['id']], {
          queryParams: { lat: null, zm: null, lang: null },
        });
        this.location.adjust_location(ev.lngLat.toArray() as [number, number]);
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
    this.cursor &&
      this.mapRef?.mapInstance.setCenter(this.cursor, {
        isPaddingChange: true,
      });
  }
}
