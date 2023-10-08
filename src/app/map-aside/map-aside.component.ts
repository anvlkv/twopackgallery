import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { Subscription, timer } from 'rxjs';
import { LocateMeBtnComponent } from '../locate-me-btn/locate-me-btn.component';
import { ZoomSyncService } from '../zoom-sync.service';
import { BreakPointService, EBreakPoint } from '../break-point.service';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  imports: [
    CommonModule,
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

  createPinLink = ['/', 'map', 'create-pin'];

  @Input('noCreate')
  noCreate: boolean = false;


  constructor(
    private zoomSync: ZoomSyncService,
    private bp: BreakPointService
  ) {}

  ngOnInit(): void {
    this.subs.push(
      this.zoomSync.zoom.subscribe(({ canZoomIn, canZoomOut }) => {
        this.canZoomIn = canZoomIn;
        this.canZoomOut = canZoomOut;
      })
    );

    this.subs.push(
      this.bp
        .query((bp) => bp < EBreakPoint.Md)
        .subscribe((mobile) => {
          if (mobile) {
            this.createPinLink = ['/', 'create-pin'];
          } else {
            this.createPinLink = ['/', 'map', 'create-pin'];
          }
        })
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe())
  }

  private handleZoomSub?: Subscription;

  handlePlus(ev: MouseEvent) {
    ev.stopPropagation();
    ev.preventDefault();
    this.endZoomHandle(ev);
    this.zoomSync.zoomIn(0.3);
    this.handleZoomSub = timer(0, 700).subscribe((i) =>
      this.zoomSync.zoomIn(0.3 * i)
    );
    return false;
  }
  handleMinus(ev: MouseEvent) {
    ev.stopPropagation();
    ev.preventDefault();
    this.endZoomHandle(ev);
    this.zoomSync.zoomOut(0.3);
    this.handleZoomSub = timer(0, 700).subscribe((i) =>
      this.zoomSync.zoomOut(0.3 * i)
    );
    return false;
  }
  endZoomHandle(ev: MouseEvent) {
    this.handleZoomSub?.unsubscribe();
    ev.preventDefault();
    return false;
  }
}
