import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { Subscription, timer } from 'rxjs';
import { LocateMeBtnComponent } from '../locate-me-btn/locate-me-btn.component';
import { ZoomSyncService } from '../zoom-sync.service';

@Component({
  standalone: true,
  imports: [
    RouterModule,
    NzButtonModule,
    NzIconModule,
    NzToolTipModule,
    LocateMeBtnComponent,
  ],
  selector: 'app-map-aside',
  templateUrl: './map-aside.component.html',
  styleUrls: ['./map-aside.component.scss'],
  host: { ngSkipHydration: 'true' },
})
export class MapAsideComponent implements OnInit, OnDestroy {
  subs: Subscription[] = [];

  canZoomIn = true;
  canZoomOut = true;

  constructor(private zoomSync: ZoomSyncService) {}

  ngOnInit(): void {
    this.subs.push(
      this.zoomSync.zoom.subscribe(({ canZoomIn, canZoomOut }) => {
        this.canZoomIn = canZoomIn;
        this.canZoomOut = canZoomOut;
      })
    );
  }

  ngOnDestroy(): void {}

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
