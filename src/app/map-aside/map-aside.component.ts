import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { Subscription, combineLatest, interval, take, timer } from 'rxjs';
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

  locating = false;
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
    this.locating = true;
    this.subs.push(
      this.location.locate().subscribe(() => (this.locating = false))
    );

    return false;
  }
  private handleZoomSub?: Subscription;

  handlePlus(ev: MouseEvent) {
    ev.stopPropagation();
    this.endZoomHandle(ev);
    this.handleZoomSub = timer(0, 700).subscribe((i) =>
      this.zoomSync.zoomIn(0.3 * (i + 1))
    );
  }
  handleMinus(ev: MouseEvent) {
    ev.stopPropagation();
    this.endZoomHandle(ev);
    this.handleZoomSub = timer(0, 700).subscribe((i) =>
      this.zoomSync.zoomOut(0.3 * (i + 1))
    );
  }
  endZoomHandle(ev: MouseEvent) {
    this.handleZoomSub?.unsubscribe();
    return false;
  }
}
