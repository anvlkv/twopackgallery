import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import type { JSONData } from '@xata.io/client';
import { LngLat, LngLatBounds } from 'mapbox-gl';
import {
  BehaviorSubject,
  Observable,
  Subject,
  combineLatest,
  debounceTime,
  finalize,
  map,
  of,
  switchMap,
  tap,
} from 'rxjs';
import type { ArtFormsPointsRecord, PointsRecord } from 'xata';
import { ArtFormsService } from './art-forms.service';
import { LocationService } from './location.service';

type PointsResult = {
  hasNextPage: boolean;
  data: JSONData<PointsRecord>[];
};
@Injectable({ providedIn: 'root' })
export class PointsService {
  private deletedPoints$ = new BehaviorSubject([] as string[]);

  deletedPoints = this.deletedPoints$.asObservable();

  private createdPoint$ = new Subject<JSONData<PointsRecord>>();

  createdPoint = this.createdPoint$.asObservable();

  private checkedBounds = new Map<string, LngLatBounds>();

  constructor(
    private http: HttpClient,
    private location: LocationService,
    private artForms: ArtFormsService
  ) {}

  public pointsInBounds(exclude: Map<string, any>) {
    return this.location.currentBounds.pipe(
      switchMap((bounds) => {
        if (bounds.length === 0) {
          const url = `/.netlify/functions/points`;
          return this.http.get<PointsResult>(url).pipe(
            tap(({ hasNextPage }) => {
              if (!hasNextPage) {
                this.addChecked(0, -90, 360, 90);
                this.addChecked(-180, -90, 180, 90);
              }
            }),
            map(({ data }) => data)
          );
        } else if (this.isContainedBound(...bounds)) {
          return of([]);
        } else {
          const url = `/.netlify/functions/points?bBox=${bounds.join(',')}`;
          let d$;
          if (exclude.size > 0) {
            d$ = this.http.post<PointsResult>(url, Array.from(exclude.keys()));
          } else {
            d$ = this.http.get<PointsResult>(url);
          }

          return d$.pipe(
            tap(({ hasNextPage }) => {
              if (!hasNextPage) {
                this.addChecked(...bounds);
              }
            }),
            map(({ data }) => data)
          );
        }
      }),
      finalize(() => {
        this.checkedBounds.clear();
      })
    );
  }

  public createNewPoint(
    formValue: Partial<Omit<JSONData<PointsRecord>, 'cover'>>,
    cover?: any
  ): Observable<JSONData<PointsRecord>> {
    return this.http
      .post<JSONData<PointsRecord>>(
        '/.netlify/functions/authorized-create_point',
        {
          ...formValue,
        }
      )
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
        `/.netlify/functions/authorized-update_point?id=${id}`,
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
      `/.netlify/functions/authorized-set_point_cover?id=${id}`,
      cover
    );
  }

  public deletePoint(id: string) {
    return this.http
      .delete<JSONData<PointsRecord>>(
        `/.netlify/functions/authorized-update_point?id=${id}`
      )
      .pipe(
        tap(() => {
          this.deletedPoints$.next([...this.deletedPoints$.getValue(), id]);
        })
      );
  }

  public flagPoint(id: string, issue: any) {
    return this.http
      .post(`/.netlify/functions/authorized-flag?id=${id}`, issue)
      .pipe(
        tap(() => {
          this.deletedPoints$.next([...this.deletedPoints$.getValue(), id]);
        })
      );
  }

  ownedPoints() {
    return combineLatest({
      descriptions: this.http.get<JSONData<ArtFormsPointsRecord>[]>(
        `/.netlify/functions/authorized-owned_points`
      ),
      artForms: this.artForms.fetchedArtForms,
    }).pipe(
      map(({ descriptions, artForms }) =>
        descriptions.reduce(
          (acc, description) => {
            const form = description.form!;

            const af = artForms.find(({ id }) => id === form.id)!;
            const id = description.point!.id!;
            const point_description = acc.get(id) || {
              ...description.point,
              art_forms: [],
            };

            acc.set(id, {
              ...point_description,
              art_forms: [
                ...(point_description?.art_forms || []),
                af.name as string,
              ],
            });

            return acc;
          },
          new Map<
            string,
            Partial<JSONData<PointsRecord>> & {
              art_forms: string[];
            }
          >()
        )
      ),
      map((d) => Array.from(d.values()))
    );
  }

  public nameValidator = (name: AbstractControl<string>, id?: string) => {
    return this.http
      .get<PointsResult>(
        `/.netlify/functions/points?title=${encodeURIComponent(
          name.value
        )}&consistency=consistency`
      )
      .pipe(
        debounceTime(500),
        map(({ data }) => {
          if ((data.length! > 0 && !id) || data[0]?.id !== id) {
            return {
              NameIsNotUnique: true,
            };
          }
          return null;
        })
      );
  };

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
}
