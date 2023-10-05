import { CommonModule } from '@angular/common';
import {
  AfterViewChecked,
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
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
  RouterModule
} from '@angular/router';
import {
  NzDrawerModule,
  NzDrawerRef,
  NzDrawerService
} from 'ng-zorro-antd/drawer';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { Subscription, filter } from 'rxjs';
import { HeaderComponent } from '../header/header.component';
import { MapAsideComponent } from '../map-aside/map-aside.component';
import { MapComponent } from '../map/map.component';
import { SearchComponent } from '../search/search.component';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    NzIconModule,
    NzDrawerModule,
    NzGridModule,
    HeaderComponent,
    MapComponent,
    MapAsideComponent,
    SearchComponent
  ],
  selector: 'app-map-layout',
  templateUrl: './map-layout.component.html',
  styleUrls: ['./map-layout.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapLayoutComponent
  implements OnInit, OnDestroy, AfterViewChecked, AfterViewInit
{
  subs: Subscription[] = [];
  isChildRouteActivated = false;

  @ViewChild('measureRef')
  measureRef!: ElementRef<HTMLDivElement>;

  @ViewChild('drawerContentTemplate')
  drawerContentTemplate!: TemplateRef<any>;

  @ViewChild('drawerExtraTemplate')
  drawerExtraTemplate!: TemplateRef<any>;

  drawerWidth = 100;

  extraLink?: string[];

  private drawerRef?: NzDrawerRef;
  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private drawers: NzDrawerService,
    private ch: ChangeDetectorRef
  ) {}

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
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
    this.drawerRef?.close();
  }

  ngAfterViewInit(): void {
    this.toggleRoutedDrawers();
  }

  ngAfterViewChecked(): void {
    this.drawerWidth = this.measureRef.nativeElement.clientWidth;

    if (this.drawerRef && this.drawerRef.nzWidth !== this.drawerWidth) {
      this.drawerRef.nzWidth = this.drawerWidth;
      this.ch.detectChanges();
    }
  }

  private _lastChecked?: ActivatedRouteSnapshot;

  toggleRoutedDrawers() {
    if (this._lastChecked === this.activatedRoute.firstChild?.snapshot) {
      return;
    }

    if (this.drawerRef) {
      this.drawerRef.close();
      this.drawerRef = undefined;
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
        nzTitle: snapshot.title,
        nzPlacement: 'right',
        nzWrapClassName: 'drawer-layout-wrapper',
        nzOnCancel: this.close.bind(this),
      });
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
    this.router.navigate(['.'], { relativeTo: this.activatedRoute });
    return Promise.resolve();
  }
}
