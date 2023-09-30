import {
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
import { MapComponent as MglMapComponent } from 'ngx-mapbox-gl';
import { BehaviorSubject, Subscription, combineLatest, map } from 'rxjs';
import type { PointsRecord } from 'xata';
import { LocationService } from '../location.service';
import { PointsService } from '../points.service';
import { ZoomSyncService } from '../zoom-sync.service';

type MapChangeEvent = MapboxEvent<
  MouseEvent | TouchEvent | WheelEvent | undefined
> &
  EventData;

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
})
export class MapComponent implements OnInit, OnDestroy {
  center?: [number, number];
  cursor?: [number, number];
  userLocation?: [number, number];
  subs: Subscription[] = [];
  zoom = 15;
  mapLoaded = false;

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
    if (this.mapLoaded) {
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
    if (!this.center) {
      this.location.locate(false);
    }
  }

  private loading$ = {
    location: new BehaviorSubject(true),
    points: new BehaviorSubject(true),
  };

  loading = combineLatest(this.loading$).pipe(
    map((subjects) => Object.values(subjects).some(Boolean))
  );

  constructor(
    private pts: PointsService,
    private location: LocationService,
    private router: Router,
    private zoomSync: ZoomSyncService
  ) {
    this.location.locate(false);
  }

  ngOnInit(): void {
    this.subs.push(
      this.location.currentLocation.subscribe((loc) => {
        this.cursor = this.center = loc;
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
  }

  mapLoad() {
    this.mapLoaded = true;
    this.location.adjust_bounds(this.mapRef.mapInstance.getBounds().toArray());
    if (this.offset) {
      this.applyMapPadding();
    }
    this.location.startTrackingLocation();
  }

  mapMove(ev: MapChangeEvent, final = true) {
    if (this.mapLoaded && this.center) {
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
    if (this.mapLoaded) {
      const nextZoom = this.mapRef.mapInstance.getZoom();
      if (final) {
        this.location.adjust_bounds(
          this.mapRef.mapInstance.getBounds().toArray()
        );
        this.zoomSync.setZoom(nextZoom);
      }
    }
  }

  clickPins(ev: MapLayerMouseEvent) {
    if (ev.features) {
      if (ev.features[0].properties!['cluster'] === true) {
        this.zoom += 1;
      } else {
        this.router.navigate(['map', 'pin', ev.features[0].properties!['id']]);
      }
    }
  }

  onMouseMoveMap(ev: MapLayerMouseEvent) {
    const hasPin =
      this.mapLoaded &&
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
