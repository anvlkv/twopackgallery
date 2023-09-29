import { Component, OnDestroy, OnInit } from '@angular/core';
import { LocationService } from '../location.service';
import { ZoomSyncService } from '../zoom-sync.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-map-aside',
  templateUrl: './map-aside.component.html',
  styleUrls: ['./map-aside.component.scss'],
})
export class MapAsideComponent implements OnInit, OnDestroy {
  subs: Subscription[] = [];

  canZoomIn = true;
  canZoomOut = true;
  
  constructor(
    private location: LocationService,
    private zoomSync: ZoomSyncService
  ) {}

  ngOnInit(): void {
    this.subs.push(
      this.zoomSync.zoom.subscribe(({ canZoomIn, canZoomOut }) => {
        this.canZoomIn = canZoomIn;
        this.canZoomOut = canZoomOut;
      })
    );
  }

  ngOnDestroy(): void {}

  handleAim(ev: MouseEvent) {
    this.location.locate();
    return false;
  }
  handlePlus(ev: MouseEvent) {
    this.zoomSync.zoomIn();
    return false;
  }
  handleMinus(ev: MouseEvent) {
    this.zoomSync.zoomOut();
    return false;
  }
}
