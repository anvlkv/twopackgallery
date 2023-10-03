import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import type { JSONData } from '@xata.io/client';
import {
  BehaviorSubject,
  Observable,
  Subject,
  debounceTime,
  filter,
  map,
  of,
  switchMap,
  tap,
} from 'rxjs';
import type { PointsRecord } from 'xata';
import { LocationService } from './location.service';
import { LngLatBounds, LngLat } from 'mapbox-gl';

@Injectable({
  providedIn: 'root',
})
export class PointsService {
  private deletedPoints$ = new BehaviorSubject([] as string[]);

  deletedPoints = this.deletedPoints$.asObservable();

  private createdPoint$ = new Subject<JSONData<PointsRecord>>();

  createdPoint = this.createdPoint$.asObservable();

  constructor(private http: HttpClient, private location: LocationService) {}

  private checkedBounds = new Map<string, LngLatBounds>();
  private isContainedBound(
    ...[minLng, minLat, maxLng, maxLat]: number[]
  ): boolean {
    const boundsKey = `${minLng};${minLat};${maxLng};${maxLat};`;
    if (this.checkedBounds.has(boundsKey)) {
      return true;
    }

    const sw = new LngLat(minLng, minLat);
    const ne = new LngLat(maxLng, maxLat);

    return Array.from(this.checkedBounds.values()).some((box) => {
      return box.contains(sw) && box.contains(ne);
    });
  }
  private addChecked(...[minLng, minLat, maxLng, maxLat]: number[]) {
    const boundsKey = `${minLng};${minLat};${maxLng};${maxLat};`;
    const sw = new LngLat(minLng, minLat);
    const ne = new LngLat(maxLng, maxLat);
    const box = new LngLatBounds(sw, ne);
    this.checkedBounds.set(boundsKey, box);
  }
  public getPointsInBounds(exclude?: Map<string, any>) {
    return this.location.currentBounds.pipe(
      filter((bounds) => bounds.length === 4),
      switchMap((bounds) => {
        if (this.isContainedBound(...bounds)) {
          return of([]);
        }

        const url = `/.netlify/functions/points?bBox=${bounds.join(',')}`;
        let d$;
        if (exclude && exclude.size > 0) {
          d$ = this.http.post<JSONData<PointsRecord>[]>(
            url,
            Array.from(exclude.keys())
          );
        } else {
          d$ = this.http.get<JSONData<PointsRecord>[]>(url);
        }

        return d$.pipe(
          tap(() => {
            this.addChecked(...bounds);
          })
        );
      })
    );
  }

  public createNewPoint(
    formValue: Partial<Omit<JSONData<PointsRecord>, 'cover'>>,
    cover?: any
  ): Observable<JSONData<PointsRecord>> {
    return this.http
      .post<JSONData<PointsRecord>>('/.netlify/functions/create_point', {
        ...formValue,
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
    >(`/.netlify/functions/point_description?id=${id}`);
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
        tap((point) => this.createdPoint$.next(point)),
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
