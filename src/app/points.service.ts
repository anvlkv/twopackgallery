import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AbstractControl, AsyncValidatorFn } from '@angular/forms';
import type { PointsRecord } from 'xata';
import type { JSONData, XataFile } from '@xata.io/client';
import {
  BehaviorSubject,
  Observable,
  Subject,
  catchError,
  debounceTime,
  filter,
  map,
  of,
  switchMap,
  tap,
} from 'rxjs';
import { LocationService } from './location.service';

@Injectable({
  providedIn: 'root',
})
export class PointsService {
  private deletedPoints$ = new BehaviorSubject([] as string[]);

  deletedPoints = this.deletedPoints$.asObservable();

  private createdPoint$ = new Subject<JSONData<PointsRecord>>();

  createdPoint = this.createdPoint$.asObservable();

  constructor(private http: HttpClient, private location: LocationService) {}

  public getPointsInBounds(exclude?: Map<string, any>) {
    return this.location.currentBounds.pipe(
      debounceTime(500),
      filter((bounds) => bounds.length === 4),
      switchMap((bounds) => {
        let url = `/.netlify/functions/points?bBox=${bounds.join(',')}`;
        if (exclude && exclude.size > 0) {
          return this.http.post<JSONData<PointsRecord>[]>(
            url,
            Array.from(exclude.keys())
          );
        } else {
          return this.http.get<JSONData<PointsRecord>[]>(url);
        }
      })
    );
  }

  public createNewPoint(
    formValue: Partial<Omit<JSONData<PointsRecord>, 'cover'>>,
    cover?: any
  ): Observable<JSONData<PointsRecord>> {
    const [longitude, latitude] = this.location.getCurrentLocation()!;
    return this.http
      .post<JSONData<PointsRecord>>('/.netlify/functions/create_point', {
        ...formValue,
        longitude,
        latitude,
      })
      .pipe(
        tap((point) => this.createdPoint$.next(point)),
        switchMap((created) => {
          if (!cover) {
            return of(created);
          }
          return this.updateCover(created.id, cover).pipe(
            map((cover) => ({ ...created, cover }))
          );
        })
      );
  }

  public getPointDescription(id: string) {
    return this.http.get<
      Partial<JSONData<PointsRecord>> & {
        art_forms: string[];
      }
    >(`/.netlify/functions/point-description?id=${id}`);
  }

  public updatePoint(
    id: string,
    updateValue: Partial<Omit<JSONData<PointsRecord>, 'cover'>>,
    updateCover?: any
  ) {
    return this.http
      .patch<JSONData<PointsRecord>>(
        `/.netlify/functions/update_point?id=${id}`,
        {
          ...updateValue,
        }
      )
      .pipe(
        switchMap((updated) => {
          if (!updateCover) {
            return of(updated);
          }
          return this.updateCover(updated.id, updateCover).pipe(
            map((cover) => ({ ...updated, cover }))
          );
        })
      );
  }

  public updateCover(id: string, cover: any): Observable<any> {
    return this.http.post<any>(
      `/.netlify/functions/set_point_cover?id=${id}`,
      cover
    );
  }

  public deletePoint(id: string) {
    return this.http
      .delete<JSONData<PointsRecord>>(
        `/.netlify/functions/update_point?id=${id}`
      )
      .pipe(
        tap(() => {
          this.deletedPoints$.next([...this.deletedPoints$.getValue(), id]);
        })
      );
  }

  public flagPoint(id: string, issue: any) {
    return this.http.post(`/.netlify/functions/flag?id=${id}`, issue).pipe(
      tap(() => {
        this.deletedPoints$.next([...this.deletedPoints$.getValue(), id]);
      })
    );
  }

  public nameValidator = (name: AbstractControl<string>, id?: string) => {
    return this.http
      .get<JSONData<PointsRecord[]>>(
        `/.netlify/functions/points?title=${encodeURIComponent(
          name.value
        )}&consistency=consistency`
      )
      .pipe(
        debounceTime(500),
        map((resp) => {
          if ((resp.length! > 0 && !id) || resp[0]?.id !== id) {
            return {
              NameIsNotUnique: true,
            };
          }
          return null;
        })
      );
  };
}
