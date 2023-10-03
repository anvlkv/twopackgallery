import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AbstractControl, ValidationErrors } from '@angular/forms';
import deepEqual from 'deep-equal';
import {
  BehaviorSubject,
  Observable,
  Subject,
  debounceTime,
  distinct,
  distinctUntilChanged,
  filter,
  from,
  map,
  race,
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
  private runningLocation$ = new Subject<[number, number]>();
  private watchId?: number;

  runningLocation = this.runningLocation$.pipe(debounceTime(250));
  currentLocation = this.currentLocation$.pipe(
    filter(Boolean),
    distinctUntilChanged(deepEqual)
  );
  currentBounds = this.currentBounds$.pipe(distinctUntilChanged(deepEqual));

  constructor(private http: HttpClient) {}

  public locate(forceNext = true) {
    race(
      this.runningLocation$.pipe(take(1)),
      from(
        new Promise<[number, number]>((resolve) => {
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                resolve([position.coords.longitude, position.coords.latitude]);
              },
              () => {
                this.locateIp().subscribe((d) => resolve(d));
              }
            );
          } else {
            this.locateIp().subscribe((d) => resolve(d));
          }
        })
      )
    )
      .pipe(filter(() => forceNext || !this.currentLocation$.getValue()))
      .subscribe((d) => this.currentLocation$.next(d));

    return this.currentLocation$.pipe(skip(1), take(1));
  }

  public startTrackingLocation() {
    if (navigator.geolocation) {
      this.watchId = navigator.geolocation.watchPosition((position) => {
        this.runningLocation$.next([
          position.coords.longitude,
          position.coords.latitude,
        ]);
      });
    }
  }

  public stopTrackingLocation() {
    if (navigator.geolocation && this.watchId !== undefined) {
      navigator.geolocation.clearWatch(this.watchId);
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
              place: data.features.find((f: any) =>
                ['place', 'locality'].includes(f.place_type.at(0))
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

  geoCodeAddress(value: Address) {
    const location = this.currentLocation$.getValue();
    const bounds = this.currentBounds$.getValue();

    const requestLocation = location ? `&proximity=${location.join(',')}` : '';

    const requestBounds = bounds ? `&bbox=${bounds.join(',')}` : '';

    return this.http.get<GeoJSON.FeatureCollection>(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
        [
          value.address_1,
          value.address_2,
          value.place,
          value.region,
          value.postcode,
          value.country,
        ]
          .filter(Boolean)
          .join(', ')
      )}.json?access_token=${
        environment.mapBoxTokenRead
      }&limit=1&types=country,region,postcode,district,place,locality,neighborhood,address${requestLocation}${requestBounds}`
    );
  }

  validateAddress(
    control: AbstractControl<Address>
  ): Observable<ValidationErrors | null> {
    const value = control.value;

    return this.geoCodeAddress(value).pipe(
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
