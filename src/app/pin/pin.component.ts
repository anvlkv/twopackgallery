import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, TitleStrategy } from '@angular/router';
import { Subscription, combineLatest, map } from 'rxjs';
import type { JSONData } from '@xata.io/client';
import type { PointsRecord } from 'xata';
import { PointsService } from '../points.service';
import { ArtFormsService } from '../art-forms.service';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { LocationService } from '../location.service';
import { ActivityService, EActivity } from '../activity.service';
import { TemplatePageTitleStrategy } from '../title.strategy';

@Component({
  selector: 'app-pin',
  templateUrl: './pin.component.html',
  styleUrls: ['./pin.component.scss'],
})
export class PinComponent implements OnInit, OnDestroy {
  id: string;
  subs: Subscription[] = [];

  data?: Partial<JSONData<PointsRecord>> & {
    art_forms: { id: string; name: string }[];
  };

  title = '';

  private titleStrategy = inject(TitleStrategy) as TemplatePageTitleStrategy;

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private pts: PointsService,
    private artForms: ArtFormsService,
    private notification: NzNotificationService,
    private location: LocationService,
    private activity: ActivityService,
  ) {
    this.id = activatedRoute.snapshot.params['id']!;
  }

  ngOnInit(): void {
    this.artForms.queryArtForms();
    this.subs.push(
      combineLatest({
        description: this.pts.getPointDescription(this.id),
        artForms: this.artForms.fetchedArtForms,
      })
        .pipe(
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
        )
        .subscribe({
          next: (d) => {
            this.data = d;
            this.title = d.title! as string;
            this.titleStrategy.entityTitle(this.title);
            this.location.adjust_location([d.longitude!, d.latitude!] as [number, number])
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

    this.activity.startActivity(EActivity.ViewPin);
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
    this.activity.leaveActivity();
    this.titleStrategy.clearEntityTitle();
  }
}
