import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { Subscription, filter, switchMap, take, tap } from 'rxjs';
import { ActivityService, EActivity } from '../activity.service';
import { PaddedPageContentComponent } from '../padded-page-content/padded-page-content.component';
import type { PointsResult } from '../points.service';
import { SearchService } from '../search.service';
import { SearchComponent } from '../search/search.component';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { PinCardComponent } from '../pin-card/pin-card.component';
import { NzGridModule } from 'ng-zorro-antd/grid';
import type { PointsRecord } from 'xata';
import { LocationService } from '../location.service';
import { ESearchType } from '../search.types';

@Component({
  selector: 'app-search-results',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    NzDividerModule,
    NzEmptyModule,
    NzIconModule,
    NzSpinModule,
    NzTypographyModule,
    NzButtonModule,
    NzGridModule,
    PinCardComponent,
    SearchComponent,
    PaddedPageContentComponent,
  ],
  templateUrl: './search-results.component.html',
  styleUrls: ['./search-results.component.scss'],
})
export class SearchResultsComponent implements OnInit, OnDestroy {
  isFullPage: boolean;
  subs: Subscription[] = [];
  leave?: () => void;
  state: 'hasQuery' | 'hasError' | PointsResult | 'empty' = 'empty';
  selectedPin?: string;
  get _state(): PointsResult {
    return this.state as unknown as PointsResult;
  }

  constructor(
    private activatedRoute: ActivatedRoute,
    private activity: ActivityService,
    private service: SearchService,
    private router: Router,
    private location: LocationService
  ) {
    this.isFullPage = activatedRoute.snapshot.data['fullPage'];
  }

  ngOnInit(): void {
    this.subs.push(
      this.activatedRoute.data.subscribe(({ fullPage }) => {
        this.isFullPage = fullPage;
      })
    );
    this.leave = this.activity.startActivity(EActivity.Search);

    this.subs.push(
      this.activatedRoute.queryParams
        .pipe(
          tap(({ query, type }) => {
            this.state =
              query ||
              [ESearchType.ByArtForm, ESearchType.ByPublisher].includes(type)
                ? 'hasQuery'
                : 'empty';
          }),
          filter(({ query, type }) => query || type),
          switchMap(({ query, type, constrain }) => {
            return this.service.runQuery(type, query, constrain);
          })
        )
        .subscribe({
          next: (d) => {
            this.state = d;
            this.selectedPin = d.data.find(({ id }) => id === this.selectedPin)
              ? this.selectedPin
              : undefined;
          },
          error: (e) => {
            this.state = 'hasError';
          },
        })
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
    this.leave && this.leave();
  }

  onClickCard(pin: PointsRecord) {
    if (this.isFullPage) {
      this.router.navigate(['/', 'pin', pin.id], { queryParams: null });
    } else {
      this.location.adjust_location([
        pin.longitude as number,
        pin.latitude as number,
      ]);
      this.selectedPin = pin.id;
    }
  }

  retry() {
    this.state = 'hasQuery';
    this.service.loadingQuery.pipe(take(1)).subscribe((q) => {
      if (q) {
        this.service.runQuery(q.type, q.query, q.constrain?.value).subscribe({
          next: (d) => {
            this.state = d;
          },
          error: (e) => {
            this.state = 'hasError';
          },
        });
      }
    });
  }
}
