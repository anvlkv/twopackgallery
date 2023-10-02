import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { Subscription } from 'rxjs';
import { LocationService } from '../location.service';
import { ZoomSyncService } from '../zoom-sync.service';

@Component({
  standalone: true,
  imports: [
    RouterModule,
    NzButtonModule,
    NzIconModule,
    NzToolTipModule,
  ],
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
