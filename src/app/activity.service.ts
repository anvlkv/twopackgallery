import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, filter } from 'rxjs';

export enum EActivity {
  None,
  PinNew,
  EditPin,
  FlagPin,
  ViewPin,
}

@Injectable({
  providedIn: 'root',
})
export class ActivityService {
  private activity$ = new BehaviorSubject(EActivity.None);
  private lastCallerId = 0;

  activity = this.activity$.asObservable();

  startActivity(act: EActivity) {
    this.activity$.next(act);
    this.lastCallerId += 1;
    const id = this.lastCallerId;
    return () => {
      if (id === this.lastCallerId) {
        this.activity$.next(EActivity.None);
      }
    };
  }

  current() {
    return this.activity$.getValue()
  }

  

  constructor() {
  }
}
