import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { AbstractControl, ValidationErrors } from '@angular/forms';
import deepEqual from 'deep-equal';
import {
  BehaviorSubject,
  NEVER,
  Observable,
  catchError,
  debounceTime,
  distinctUntilChanged,
  filter,
  from,
  map,
  skip,
  take,
} from 'rxjs';
import { environment } from 'src/environments/environment';

export type Address = {
  address_1?: string;
  address_2?: string;
  postcode?: string;
  place?: string;
  region?: string;
  country?: string;
  code?: string;
};

@Injectable({
  providedIn: 'root',
})
export class LocationService {
  private currentLocation$ = new BehaviorSubject<[number, number] | undefined>(
    undefined
  );
  private currentAccuracy$ = new BehaviorSubject(0);
  private currentBounds$ = new BehaviorSubject([] as number[][]);
  private runningLocation$ = new BehaviorSubject<[number, number] | undefined>(
    undefined
  );
  private watchLocation?: any;

  runningLocation: Observable<[number, number]> = this.runningLocation$.pipe(
    filter(Boolean)
  );
  currentLocation: Observable<[number, number]> = this.currentLocation$.pipe(
    filter(Boolean),
    distinctUntilChanged(deepEqual)
  );
  currentBounds: Observable<[number, number][]> = this.currentBounds$.pipe(
    distinctUntilChanged(deepEqual)
  );

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  public locate() {
    from(this.geoLocation())
      .pipe(catchError(() => this.locateIp()))
      .subscribe({
        next: (d) => {
          this.currentLocation$.next(d);
        },
        error: (e) => this.currentLocation$.error(e),
      });

    return this.currentLocation$.pipe(skip(1), take(1));
  }

  private geoLocation() {
    if (isPlatformBrowser(this.platformId)) {
      return new Promise<[number, number]>((resolve, reject) => {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              resolve([position.coords.longitude, position.coords.latitude]);
            },
            () => {
              reject();
            },
            {
              maximumAge: 10000,
            }
          );
        } else {
          reject();
        }
      });
    } else {
      return NEVER;
    }
  }

  public startTrackingLocation() {
    if (isPlatformBrowser(this.platformId)) {
      if (navigator.geolocation) {
        this.watchLocation = navigator.geolocation.watchPosition(
          (geolocation) => {
            this.runningLocation$.next([
              geolocation.coords.longitude,
              geolocation.coords.latitude,
            ]);
          },
          () => {},
          {
            maximumAge: 30000,
            enableHighAccuracy: false,
          }
        );
      }
    }
  }

  public stopTrackingLocation() {
    if (
      isPlatformBrowser(this.platformId) &&
      this.watchLocation !== undefined
    ) {
      if (navigator.geolocation) {
        navigator.geolocation.clearWatch(this.watchLocation);
      }
    }
  }

  private locateIp() {
    return this.http.get('/.netlify/functions/geo_ip').pipe(
      map((resp) => {
        return resp as [number, number];
      })
    );
  }

  public getCurrentLocation() {
    return this.currentLocation$.getValue()!;
  }

  public adjust_location(value: [number, number]) {
    this.currentLocation$.next(value);
  }

  public adjust_accuracy(value: number) {
    this.currentAccuracy$.next(value);
  }

  public adjust_bounds(value: number[][]) {
    this.currentBounds$.next(value);
  }

  public reverseGeoCode(value: [number, number]) {
    return this.http
      .get(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${value.join(
          ','
        )}.json?access_token=${environment.mapBoxTokenRead}&language=en`
      )
      .pipe(
        map(
          (data: any) =>
            ({
              address_1: data.features.find(
                (f: any) =>
                  f.place_type.at(0) === 'address' &&
                  f.properties.accuracy === 'rooftop'
              )?.address,
              address_2: data.features.find(
                (f: any) =>
                  f.place_type.at(0) === 'address' &&
                  f.properties.accuracy === 'street'
              )?.text_en,
              postcode: data.features.find(
                (f: any) => f.place_type.at(0) === 'postcode'
              )?.text,
              place: data.features.find((f: any) =>
                ['place', 'locality'].includes(f.place_type.at(0))
              )?.text_en,
              region: data.features.find(
                (f: any) => f.place_type.at(0) === 'region'
              )?.text_en,
              code: data.features
                .find((f: any) => f.place_type.at(0) === 'country')
                ?.properties.short_code.toUpperCase(),
            } as Address)
        )
      );
  }

  geoCodeAddress(value: Address) {
    const location = this.currentLocation$.getValue();

    const requestLocation = location ? `&proximity=${location.join(',')}` : '';

    return this.http.get<GeoJSON.FeatureCollection>(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
        [
          value.address_1,
          value.address_2,
          value.place,
          value.region,
          value.postcode,
        ]
          .filter(Boolean)
          .join(', ')
      )}.json?access_token=${
        environment.mapBoxTokenRead
      }&limit=3&types=neighborhood,address&country=${value.code?.toLowerCase()}${requestLocation}`
    );
  }

  validateAddress(
    control: AbstractControl<Address>
  ): Observable<ValidationErrors | null> {
    const value = control.value;

    return this.geoCodeAddress(value).pipe(
      debounceTime(500),
      map((response: any) => {
        if (
          response.features.filter((f: any) => f.relevance >= 0.5).length === 0
        ) {
          return {
            NothingFound: 'We could not find this location',
          };
        }
        return null;
      })
    );
  }
}
