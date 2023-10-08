import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SearchComponent } from '../search/search.component';
import { PaddedPageContentComponent } from '../padded-page-content/padded-page-content.component';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzIconModule } from 'ng-zorro-antd/icon';

@Component({
  selector: 'app-search-results',
  standalone: true,
  imports: [
    CommonModule,
    NzDividerModule,
    NzEmptyModule,
    NzIconModule,
    SearchComponent,
    PaddedPageContentComponent,
  ],
  templateUrl: './search-results.component.html',
  styleUrls: ['./search-results.component.scss'],
})
export class SearchResultsComponent implements OnInit, OnDestroy {
  isFullPage: boolean;
  subs: Subscription[] = [];

  constructor(private activatedRoute: ActivatedRoute) {
    this.isFullPage = activatedRoute.snapshot.data['fullPage'];
  }

  ngOnInit(): void {
    this.subs.push(
      this.activatedRoute.data.subscribe(({ fullPage }) => {
        this.isFullPage = fullPage;
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
  }
}
