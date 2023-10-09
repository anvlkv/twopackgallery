import { CommonModule, Location } from '@angular/common';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { Subscription, combineLatest } from 'rxjs';
import { BreakPointService, EBreakPoint } from '../break-point.service';
import { ZoomSyncService } from '../zoom-sync.service';
import { LocationService } from '../location.service';

@Component({
  selector: 'app-create-pin-btn',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    NzButtonModule,
    NzIconModule,
    NzToolTipModule,
  ],
  templateUrl: './create-pin-btn.component.html',
  styleUrls: ['./create-pin-btn.component.scss'],
})
export class CreatePinBtnComponent implements OnInit, OnDestroy {
  @Input('nzSize')
  nzSize = 'default' as 'default' | 'large';

  subs: Subscription[] = [];

  createPinLink = ['/', 'map', 'create-pin'];
  cratePinParams?: {
    lng: number;
    lat: number;
    zm: number;
  };

  constructor(
    private zoom: ZoomSyncService,
    private location: LocationService,
    private bp: BreakPointService
  ) {}

  ngOnInit(): void {
    this.subs.push(
      combineLatest({
        zoom: this.zoom.zoom,
        location: this.location.currentLocation,
        mobile: this.bp.query((bp) => bp < EBreakPoint.Md),
      }).subscribe(({ mobile, zoom, location }) => {
        if (mobile) {
          this.createPinLink = ['/', 'create-pin'];
          this.cratePinParams = {
            zm: zoom.value,
            lng: location[0],
            lat: location[1],
          };
        } else {
          this.cratePinParams = undefined;
          this.createPinLink = ['/', 'map', 'create-pin'];
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
  }
}
