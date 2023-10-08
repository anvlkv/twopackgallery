import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import {
  ActivatedRoute,
  ActivatedRouteSnapshot,
  EventType,
  Router,
  RouterModule,
} from '@angular/router';
import {
  NzDrawerModule,
  NzDrawerRef,
  NzDrawerService,
} from 'ng-zorro-antd/drawer';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { Subscription, combineLatest, filter } from 'rxjs';
import { ActivityService } from '../activity.service';
import { ArtFormsService } from '../art-forms.service';
import { BreakPointService, EBreakPoint } from '../break-point.service';
import { HeaderComponent } from '../header/header.component';
import { LocationService } from '../location.service';
import { MapAsideComponent } from '../map-aside/map-aside.component';
import { MapComponent } from '../map/map.component';
import { PointsService } from '../points.service';
import { SearchComponent } from '../search/search.component';
import { ZoomSyncService } from '../zoom-sync.service';
import { NzButtonModule } from 'ng-zorro-antd/button';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    NzIconModule,
    NzDrawerModule,
    NzGridModule,
    NzButtonModule,
    HeaderComponent,
    MapComponent,
    MapAsideComponent,
    SearchComponent,
  ],
  selector: 'app-map-layout',
  templateUrl: './map-layout.component.html',
  styleUrls: ['./map-layout.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    PointsService,
    ArtFormsService,
    LocationService,
    ZoomSyncService,
    ActivityService,
  ],
})
export class MapLayoutComponent implements OnInit, OnDestroy, AfterViewInit {
  subs: Subscription[] = [];
  isChildRouteActivated = false;

  @ViewChild('drawerContentTemplate')
  drawerContentTemplate!: TemplateRef<any>;

  @ViewChild('drawerExtraTemplate')
  drawerExtraTemplate!: TemplateRef<any>;

  drawerWidth = 100;
  drawerHeight = 100;

  extraLink?: string[];
  mobile: boolean;
  mapOffset?: [number, number];

  private drawerRef?: NzDrawerRef;
  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private drawers: NzDrawerService,
    private ch: ChangeDetectorRef,
    private bp: BreakPointService
  ) {
    this.mobile = this.bp.getBreakPoint() < EBreakPoint.Md;
  }

  ngOnInit(): void {
    this.subs.push(
      this.router.events
        .pipe(
          filter((ev) => {
            return [
              EventType.ChildActivationStart,
              EventType.NavigationEnd,
              EventType.NavigationCancel,
              EventType.NavigationError,
            ].includes(ev.type);
          })
        )
        .subscribe(() => {
          this.toggleRoutedDrawers();
        })
    );

    this.subs.push(
      combineLatest({
        mobile: this.bp.query((b) => b < EBreakPoint.Md),
        width: this.bp.columnsQuery({
          [EBreakPoint.Xs]: 24,
          [EBreakPoint.Md]: 12,
          [EBreakPoint.Lg]: 10,
          [EBreakPoint.XXl]: 9,
        }),
        height: this.bp.heightQuery({
          [EBreakPoint.Xs]: 2 / 3,
          [EBreakPoint.Sm]: 1 / 2,
          [EBreakPoint.Md]: 1,
        }),
      }).subscribe(({ mobile, width, height }) => {
        this.mobile = mobile;
        this.drawerWidth = width;
        this.drawerHeight = height;
        if (this.drawerRef) {
          this.drawerRef.nzPlacement = this.mobile ? 'bottom' : 'right';
          this.drawerRef.nzWidth = width;
          this.drawerRef.nzHeight = height;
          this.mapOffset = this.mobile
            ? [0, this.drawerHeight]
            : [this.drawerWidth, 0];
        }

        this.ch.detectChanges();
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
    this.drawerRef?.close();
  }

  ngAfterViewInit(): void {
    this.toggleRoutedDrawers();
  }

  private _lastChecked?: ActivatedRouteSnapshot;

  toggleRoutedDrawers() {
    if (
      this._lastChecked?.component ===
      this.activatedRoute.firstChild?.snapshot.component
    ) {
      return;
    } else if (this.drawerRef) {
      this.drawerRef.close();
      this.drawerRef = undefined;
      this.mapOffset = undefined;
    }

    if (this.activatedRoute.firstChild) {
      const snapshot = this.activatedRoute.firstChild.snapshot;
      this.drawerRef = this.drawers.create({
        nzClosable: true,
        nzBodyStyle: { padding: 0, position: 'relative' },
        nzMask: false,
        nzContent: this.drawerContentTemplate,
        nzExtra: this.drawerExtraTemplate,
        nzWidth: this.drawerWidth,
        nzHeight: this.drawerHeight,
        nzTitle: snapshot.title,
        nzPlacement: this.mobile ? 'bottom' : 'right',
        nzWrapClassName: 'drawer-layout-wrapper',
        nzOnCancel: this.close.bind(this),
      });

      this.mapOffset = this.mobile
        ? [0, this.drawerHeight]
        : [this.drawerWidth, 0];

      this.isChildRouteActivated = true;
      this.extraLink = snapshot.url.map(({ path }) => path);
      this.extraLink.unshift(
        ...this.activatedRoute.snapshot.url.map(() => '../')
      );
    } else {
      this.isChildRouteActivated = false;
      this.extraLink = undefined;
    }
    this._lastChecked = this.activatedRoute.firstChild?.snapshot;
    this.ch.detectChanges();
  }

  close() {
    this.router.navigate(this.activatedRoute.snapshot.url, {
      queryParamsHandling: 'preserve',
      relativeTo: this.activatedRoute.root,
    });
    return Promise.resolve();
  }
}
