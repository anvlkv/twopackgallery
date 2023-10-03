import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { Subscription, combineLatest, take } from 'rxjs';
import { LocationService } from '../location.service';
import { ZoomSyncService } from '../zoom-sync.service';

@Component({
  standalone: true,
  imports: [RouterModule, NzButtonModule, NzIconModule, NzToolTipModule],
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

  locating = false;
  handleAim(ev: MouseEvent) {
    this.locating = true;
    this.subs.push(
      combineLatest({
        location: this.location.locate(),
        zoom: this.zoomSync.zoom,
      })
        .pipe(take(1))
        .subscribe(({ zoom }) => {
          this.locating = false;
          if ((zoom.value || 0) < 12) {
            this.zoomSync.setZoom(12);
          }
        })
    );

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
