import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import type { Identifiable, JSONData } from '@xata.io/client';
import { LngLat, LngLatBounds } from 'mapbox-gl';
import {
  BehaviorSubject,
  Observable,
  combineLatest,
  debounceTime,
  finalize,
  map,
  of,
  switchMap,
  tap,
} from 'rxjs';
import type { ArtFormsRecord, PointsRecord, UsersPointsRecord } from 'xata';
import { LocationService } from './location.service';
import { UserService } from './user.service';

type PointsResult = {
  hasNextPage: boolean;
  data: JSONData<PointsRecord>[];
};
@Injectable({ providedIn: 'root' })
export class PointsService {
  private publishedPoints$ = new BehaviorSubject<JSONData<PointsRecord>[]>([]);
  private ownedPoints$ = new BehaviorSubject<JSONData<PointsRecord>[]>([]);
  private deletedPoints$ = new BehaviorSubject<string[]>([]);
  private contributingPoints$ = new BehaviorSubject<JSONData<PointsRecord>[]>(
    []
  );
  private allPointsSnapshot?: Identifiable[];

  public allPoints = combineLatest({
    published: this.publishedPoints$,
    owned: this.ownedPoints$,
    contributing: this.contributingPoints$,
    deleted: this.deletedPoints$,
  }).pipe(
    map(({ published, owned, contributing, deleted }) => {
      return [
        ...published.map((p) => ({ ...p, pointType: 'published' })),
        ...owned.map((p) => ({ ...p, pointType: 'owned' })),
        ...contributing.map((p) => ({ ...p, pointType: 'contributing' })),
      ].filter(({ id }) => !deleted.includes(id));
    })
  );

  private checkedBounds = new Map<string, LngLatBounds>();

  constructor(
    private http: HttpClient,
    private location: LocationService,
    private user: UserService
  ) {
    this.user.user.subscribe((user) => {
      this.ownedPoints$.next(
        user?.ownerships?.map((o) => o.point! as any) || []
      );
      this.contributingPoints$.next(
        user?.contributions?.map((o) => o.point! as any) || []
      );
    });

    this.allPoints.subscribe((p) => (this.allPointsSnapshot = p));
  }

  public pointsInBounds() {
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
          const exclude = this.allPointsSnapshot?.map(({ id }) => id) || [];
          const url = `/.netlify/functions/points?bBox=${bounds.join(',')}`;
          let d$;
          if (exclude.length > 0) {
            d$ = this.http.post<PointsResult>(url, exclude);
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
      switchMap((points) => {
        this.publishedPoints$.next([
          ...this.publishedPoints$.getValue(),
          ...points,
        ]);

        return this.allPoints;
      }),
      finalize(() => {
        this.checkedBounds.clear();
      })
    );
  }

  public createNewPoint(
    formValue: Partial<Omit<JSONData<PointsRecord>, 'cover'>>,
    cover?: any,
    tile?: any
  ): Observable<
    JSONData<{ point: PointsRecord; ownership: UsersPointsRecord }>
  > {
    return this.http
      .post<JSONData<{ point: PointsRecord; ownership: UsersPointsRecord }>>(
        '/.netlify/functions/authorized-create_point',
        {
          ...formValue,
        }
      )
      .pipe(
        tap(({ ownership }) => this.user.onAddOwnership(ownership!)),
        switchMap((created) => {
          if (!cover) {
            return of(created);
          }
          return this.updateCover(created.point!.id, cover).pipe(
            map(
              (cover) =>
                ({
                  ...created,
                  point: { ...created.point, cover },
                } as JSONData<{
                  point: PointsRecord;
                  ownership: UsersPointsRecord;
                }>)
            )
          );
        }),
        switchMap((created) => {
          if (!tile) {
            return of(created);
          }
          return this.updateTile(created.point!.id, tile).pipe(
            map(
              (tile) =>
                ({
                  ...created,
                  point: { ...created.point, tile },
                } as any)
            )
          );
        })
      );
  }

  public getPointDescription(id: string) {
    return this.http.get<
      Partial<JSONData<PointsRecord>> & {
        art_forms: JSONData<ArtFormsRecord>[];
      }
    >(`/.netlify/functions/authorized-point_description?id=${id}`);
  }

  public updatePoint(
    id: string,
    updateValue: Partial<Omit<JSONData<PointsRecord>, 'cover'>>,
    updateCover?: any,
    updateTile?: any
  ) {
    return this.http
      .patch<JSONData<PointsRecord>>(
        `/.netlify/functions/authorized-update_point?id=${id}`,
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
        }),
        switchMap((updated) => {
          if (!updateTile) {
            return of(updated);
          }
          return this.updateTile(updated.id, updateTile).pipe(
            map((tile) => ({ ...updated, tile }))
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
  public updateTile(id: string, tile: any): Observable<any> {
    return this.http.post<any>(
      `/.netlify/functions/authorized-set_point_tile?id=${id}`,
      tile
    );
  }

  public deletePoint(id: string) {
    return this.http
      .delete<JSONData<PointsRecord>>(
        `/.netlify/functions/authorized-update_point?id=${id}`
      )
      .pipe(
        tap(() => {
          this.user.onRemoveOwnership(id);
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

  public nameValidator = (name: AbstractControl<string>, id?: string) => {
    return this.http
      .get<JSONData<PointsRecord> | undefined>(
        `/.netlify/functions/validate_point_title?title=${encodeURIComponent(
          name.value
        )}&consistency=consistency`
      )
      .pipe(
        debounceTime(500),
        map((point) => {
          if (point) {
            if (point.id === id) {
              return null;
            } else {
              return { NameIsNotUnique: true };
            }
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
