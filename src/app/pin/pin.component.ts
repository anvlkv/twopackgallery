import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import {
  ActivatedRoute,
  Router,
  RouterModule,
  TitleStrategy,
} from '@angular/router';
import { AuthService } from '@auth0/auth0-angular';
import type { JSONData } from '@xata.io/client';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import {
  Subscription,
  combineLatest,
  distinctUntilChanged,
  filter,
  map,
  switchMap,
} from 'rxjs';
import type { PointsRecord } from 'xata';
import { ActivityService, EActivity } from '../activity.service';
import { ArtFormsService } from '../art-forms.service';
import { CoverImageComponent } from '../cover-image/cover-image.component';
import { LocationService } from '../location.service';
import { PointsService } from '../points.service';
import { TemplatePageTitleStrategy } from '../title.strategy';
import { UserService } from '../user.service';
import { COVER_RATIO } from '../cover-image/consts';
import { MiniMapComponent } from '../mini-map/mini-map.component';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    NzSkeletonModule,
    NzGridModule,
    NzSpaceModule,
    NzButtonModule,
    NzIconModule,
    NzTagModule,
    NzDividerModule,
    NzTypographyModule,
    CoverImageComponent,
    MiniMapComponent,
  ],
  selector: 'app-pin',
  templateUrl: './pin.component.html',
  styleUrls: ['./pin.component.scss'],
})
export class PinComponent implements OnInit, OnDestroy {
  id: string;
  subs: Subscription[] = [];
  canEdit = false;
  canFlag = false;
  data?: Partial<JSONData<PointsRecord>> & {
    art_forms: { id: string; name: string }[];
  };
  isFullPage = false;
  title = '';
  mapPoint: [number, number] = [0, 0];
  coverRatio = COVER_RATIO.STR;

  private titleStrategy = inject(TitleStrategy) as TemplatePageTitleStrategy;

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private pts: PointsService,
    private artForms: ArtFormsService,
    private notification: NzNotificationService,
    private location: LocationService,
    private activity: ActivityService,
    public auth: AuthService,
    private user: UserService
  ) {
    this.id = activatedRoute.snapshot.params['id'];
  }

  private leave?: () => void;
  ngOnInit(): void {
    this.subs.push(
      this.activatedRoute.params
        .pipe(
          map(({ id }) => id),
          distinctUntilChanged(),
          switchMap((id) => {
            this.id = id!;
            this.data = undefined;
            return combineLatest({
              description: this.pts.getPointDescription(id),
              artForms: this.artForms.fetchedArtForms,
            }).pipe(
              map(({ description, artForms }) => ({
                ...description,
                art_forms: description.art_forms
                  .map((id) => ({
                    id,
                    name: artForms.find(({ id: a_id }) => a_id === id)
                      ?.name as string,
                  }))
                  .filter(({ name }) => Boolean(name)),
              }))
            );
          })
        )
        .subscribe({
          next: (data) => {
            this.data = data;
            this.title = data.title! as string;
            this.mapPoint = [data.longitude as number, data.latitude as number];
            this.titleStrategy.entityTitle(this.title);
            this.location.adjust_location([data.longitude!, data.latitude!] as [
              number,
              number
            ]);
          },
          error: (err) => {
            this.notification.error('Something went wrong...', err.message);
            if (err.code === 404) {
              this.router.navigate(['not-found'], {
                replaceUrl: true,
                relativeTo: this.activatedRoute,
              });
            }
          },
        })
    );

    this.leave = this.activity.startActivity(EActivity.ViewPin);

    this.subs.push(
      combineLatest({
        user: this.auth.user$,
        id: this.activatedRoute.params.pipe(
          map(({ id }) => id as string),
          distinctUntilChanged()
        ),
      })
        .pipe(
          filter((d) => Boolean(d.user)),
          switchMap(({ user, id }) => this.user.pointOwnership(user!.sub!, id!))
        )
        .subscribe((isOwner) => {
          this.canEdit = isOwner;
          this.canFlag = !isOwner;
        })
    );

    this.subs.push(
      this.activatedRoute.data.subscribe(({ fullPage }) => {
        this.isFullPage = fullPage;
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
    this.titleStrategy.clearEntityTitle();
    this.leave && this.leave();
  }
}
