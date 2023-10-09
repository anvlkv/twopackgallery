import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, tap } from 'rxjs';
import type { PointsResult } from './points.service';
import { ESearchType } from './search.types';
import { Term } from './search/search.component';

@Injectable({
  providedIn: 'root',
})
export class SearchService {
  private loadingQuery$ = new BehaviorSubject<Term | undefined>(undefined);

  loadingQuery = this.loadingQuery$.asObservable();

  constructor(private http: HttpClient) {}

  initSearchData() {
    return combineLatest({
      tops: this.http.get<{
        art_forms: { name: string; id: string }[];
        tags: string[];
      }>(`/.netlify/functions/search_init_data`),
    });
  }

  runQuery(type: ESearchType, query = '', constrain?: string) {
    this.loadingQuery$.next({
      type,
      query,
      constrain: constrain ? { value: constrain, label: '...' } : undefined,
    });

    return this.http.get<PointsResult>(
      `/.netlify/functions/search?type=${type}&query=${query}${
        constrain ? `&constrain=${constrain}` : ''
      }`
    ).pipe(tap(() => {
      this.loadingQuery$.next(undefined)
    }));
  }
}
