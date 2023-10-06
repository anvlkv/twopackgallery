import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { NgxMapboxGLModule } from 'ngx-mapbox-gl';
import { Subscription } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AvatarComponent } from '../avatar/avatar.component';
import { BrowserStorageService } from '../browser-storage.service';
import { Consent, LOCATION_CONSENT_KEY } from '../locate-me-btn/locate-me-btn.component';
import { LocationService } from '../location.service';

@Component({
  standalone: true,
  imports: [CommonModule, NgxMapboxGLModule, AvatarComponent],
  selector: 'app-mini-map',
  templateUrl: './mini-map.component.html',
  styleUrls: ['./mini-map.component.scss'],
})
export class MiniMapComponent implements OnInit, OnDestroy {
  accessToken = environment.mapBoxTokenRead;
  initialZoom: [number] = [13];

  subs: Subscription[] = [];
  userLocation?: [number, number];

  public pinSrc: GeoJSON.Feature = {
    type: 'Feature',
    geometry: { coordinates: [0, 0], type: 'Point' },
    properties: {},
  };
  @Input('point')
  set point(coordinates: [number, number]) {
    this.pinSrc = {
      ...this.pinSrc,
      geometry: {
        type: 'Point',
        coordinates,
      },
    };
  }
  get point(): [number, number] {
    return (this.pinSrc.geometry as GeoJSON.Point).coordinates as [
      number,
      number
    ];
  }

  constructor(
    private location: LocationService,
    private storage: BrowserStorageService
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
  }

  ngOnDestroy(): void {
    this.location.stopTrackingLocation();
    this.subs.forEach((s) => s.unsubscribe());
  }
}
