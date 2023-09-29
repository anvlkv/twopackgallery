import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AbstractControl, ValidationErrors } from '@angular/forms';
import deepEqual from 'deep-equal';
import {
  BehaviorSubject,
  Observable,
  debounceTime,
  distinct,
  distinctUntilChanged,
  filter,
  map,
} from 'rxjs';
import { environment } from 'src/environments/environment';

export type Address = {
  poi?: string;
  address_1?: string;
  address_2?: string;
  postcode?: string;
  place?: string;
  region?: string;
  country?: string;
};

@Injectable({
  providedIn: 'root',
})
export class LocationService {
  private currentLocation$ = new BehaviorSubject<[number, number] | undefined>(
    undefined
  );
  private currentAccuracy$ = new BehaviorSubject(0);
  private currentBounds$ = new BehaviorSubject([] as number[]);

  currentLocation = this.currentLocation$.pipe(
    filter(Boolean),
    distinctUntilChanged(deepEqual)
  );
  currentAccuracy = this.currentAccuracy$.pipe(distinct());
  currentBounds = this.currentBounds$.pipe(distinctUntilChanged(deepEqual));

  constructor(private http: HttpClient) {}

  public locate(forceNext = true) {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (forceNext || !this.currentLocation$.getValue()) {
            this.currentLocation$.next([
              position.coords.longitude,
              position.coords.latitude,
            ]);
            this.currentAccuracy$.next(position.coords.accuracy);
          }
        },
        () => {
          this.locateIp(forceNext);
        }
      );
    } else {
      this.locateIp(forceNext);
    }
  }

  private locateIp(forceNext = true) {
    this.http
      .get('/.netlify/functions/geo_ip')
      .pipe(
        map((resp) => {
          return resp as [number, number];
        })
      )
      .subscribe((coords) => {
        if (forceNext || !this.currentLocation$.getValue()) {
          this.currentLocation$.next(coords);
          this.currentAccuracy$.next(1000);
        }
      });
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
    this.currentBounds$.next(value.flatMap((v) => v));
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
              poi: data.features.find((f: any) => f.place_type.at(0) === 'poi')
                ?.text_en,
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
              place: data.features.find(
                (f: any) => f.place_type.at(0) === 'place'
              )?.text_en,
              region: data.features.find(
                (f: any) => f.place_type.at(0) === 'region'
              )?.text_en,
              country: data.features.find(
                (f: any) => f.place_type.at(0) === 'country'
              )?.text_en,
            } as Address)
        )
      );
  }

  validateAddress(
    control: AbstractControl<Address>
  ): Observable<ValidationErrors | null> {
    const value = control.value;
    const location = this.currentLocation$.getValue();
    const bounds = this.currentBounds$.getValue();

    return this.http
      .get(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          [
            value.poi,
            value.address_1,
            value.address_2,
            value.place,
            value.region,
            value.country,
            value.postcode,
          ]
            .filter(Boolean)
            .join(', ')
        )}.json?access_token=${
          environment.mapBoxTokenRead
        }&limit=1&types=country,region,postcode,district,place,locality,neighborhood,address${
          location ? `&proximity=${location.join(',')}` : ''
        }&bbox=${bounds.join(',')}`
      )
      .pipe(
        debounceTime(500),
        map((response: any) => {
          if (response.features.length === 0) {
            return {
              NothingFound: 'We could not find this location',
            };
          }

          return null;
        })
      );
  }
}
