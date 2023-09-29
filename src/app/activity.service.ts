import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export enum EActivity {
  None,
  PinNew,
  EditPin,
  FlagPin,
  ViewPin
}

@Injectable({
  providedIn: 'root'
})
export class ActivityService {
  private activity$ = new BehaviorSubject(EActivity.None)

  activity = this.activity$.asObservable();

  startActivity(act: EActivity) {
    this.activity$.next(act);
  }

  leaveActivity() {
    this.activity$.next(EActivity.None)
  }

  constructor() { }
}
