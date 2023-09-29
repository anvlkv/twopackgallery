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
  Router,
  ActivatedRoute,
  EventType,
  NavigationEnd,
  ActivatedRouteSnapshot,
  UrlSegment,
} from '@angular/router';
import {
  NzDrawerComponent,
  NzDrawerRef,
  NzDrawerService,
} from 'ng-zorro-antd/drawer';
import { Subscription, filter, map } from 'rxjs';

@Component({
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
        nzMaskClosable: true,
        nzMaskStyle: { opacity: 0 },
        nzBodyStyle: { padding: 0, position: 'relative' },
        nzContent: this.drawerContentTemplate,
        nzExtra: this.drawerExtraTemplate,
        nzWidth: this.drawerWidth,
        nzTitle: snapshot.title,
        nzPlacement: 'right',
        nzOnCancel: this.close.bind(this),
      });
      this.isChildRouteActivated = true;
      this.extraLink = snapshot.url.map(({ path }, i) => {
        if (this.activatedRoute.snapshot.url[i]?.path == path) {
          return '../';
        } else {
          return path;
        }
      });
    } else {
      this.isChildRouteActivated = false;
      this.extraLink = undefined;
    }
    this._lastChecked = this.activatedRoute.firstChild?.snapshot;
    this.ch.detectChanges();
  }

  close() {
    this.router.navigate(['.'], { relativeTo: this.activatedRoute.parent });
    return Promise.resolve();
  }
}
