import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import {
  MapComponent as MglMapComponent,
  NgxMapboxGLModule,
} from 'ngx-mapbox-gl';
import { Subscription } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AvatarComponent } from '../avatar/avatar.component';
import { BrowserStorageService } from '../browser-storage.service';
import {
  Consent,
  LOCATION_CONSENT_KEY,
} from '../locate-me-btn/locate-me-btn.component';
import { LocationService } from '../location.service';
import { CursorComponent } from '../cursor/cursor.component';
import { MapAsideComponent } from '../map-aside/map-aside.component';
import { ZoomSyncService } from '../zoom-sync.service';
import type { EventData, MapboxEvent } from 'mapbox-gl';
import deepEqual from 'deep-equal';

type MapChangeEvent = MapboxEvent<
  MouseEvent | TouchEvent | WheelEvent | undefined
> &
  EventData;
@Component({
  standalone: true,
  imports: [
    CommonModule,
    NgxMapboxGLModule,
    AvatarComponent,
    CursorComponent,
    MapAsideComponent,
  ],
  selector: 'app-mini-map',
  templateUrl: './mini-map.component.html',
  styleUrls: ['./mini-map.component.scss'],
})
export class MiniMapComponent implements OnInit, OnDestroy, OnChanges {
  accessToken = environment.mapBoxTokenRead;
  initialZoom: [number] = [0.1];
  initialPosition?: [number, number] = this.point;
  userLocation?: [number, number];

  subs: Subscription[] = [];

  @Input('point')
  point?: [number, number];

  @Input('animateCursor')
  animateCursor?: boolean

  @Output('pointChange')
  pointChange = new EventEmitter<[number, number]>();

  @ViewChild('mapRef', { read: MglMapComponent })
  mapRef?: MglMapComponent;

  constructor(
    private location: LocationService,
    private storage: BrowserStorageService,
    private zoomSync: ZoomSyncService
  ) {}

  ngOnInit(): void {
    if (this.storage.get<Consent>(LOCATION_CONSENT_KEY)?.consent === 'accept') {
      this.location.startTrackingLocation();
      this.subs.push(
        this.location.runningLocation.subscribe(
          (location) => (this.userLocation = location)
        )
      );
    }

    this.subs.push(
      this.zoomSync.zoom.subscribe(({ value }) => {
        this.mapRef?.mapInstance.setZoom(value);
      })
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      !deepEqual(
        changes['point'].currentValue,
        changes['point'].previousValue
      ) &&
      changes['point'].currentValue
    ) {
      this.mapRef?.mapInstance.setCenter(changes['point'].currentValue);
    }

    if(changes['point'].firstChange) {
      this.initialPosition = changes['point'].currentValue

      if (changes['point'].currentValue) {
        this.initialZoom = [12.17];
        this.zoomSync.setZoom(12.17);
      }
    }
  }

  ngOnDestroy(): void {
    this.location.stopTrackingLocation();
    this.subs.forEach((s) => s.unsubscribe());
  }

  onZoom(ev: MapChangeEvent) {
    if (this.mapRef?.mapInstance && ev.originalEvent) {
      this.zoomSync.setZoom(this.mapRef.mapInstance.getZoom());
    }
    return false;
  }
  onMove(ev: MapChangeEvent, final = true) {
    const center = this.mapRef?.mapInstance.getCenter().toArray() as [number, number];
    if (center && ev.originalEvent && final) {
      this.pointChange.emit(center);
    }
    if (this.animateCursor) {
      this.point = center;
    }
    return false;
  }
}
