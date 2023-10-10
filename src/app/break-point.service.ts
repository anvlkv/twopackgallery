import { Injectable } from '@angular/core';
import {
  BehaviorSubject,
  combineLatest,
  distinctUntilChanged,
  map,
} from 'rxjs';

export enum EBreakPoint {
  Xs,
  Sm,
  Md,
  Lg,
  Xl,
  XXl,
}

@Injectable({
  providedIn: 'root',
})
export class BreakPointService {
  private breakPoint$ = new BehaviorSubject(EBreakPoint.Xs);
  private colSize$ = new BehaviorSubject(16);
  private height$ = new BehaviorSubject(860);

  public breakpoint = this.breakPoint$.asObservable();

  constructor() {}

  setBreakPoint(value: EBreakPoint) {
    this.breakPoint$.next(value);
  }

  getBreakPoint() {
    return this.breakPoint$.getValue();
  }
  setColSize(value: number) {
    this.colSize$.next(value);
  }

  getColSize() {
    return this.colSize$.getValue();
  }

  setHeight(value: number) {
    this.height$.next(value);
  }

  getHeight() {
    return this.height$.getValue();
  }

  query(condition: (val: EBreakPoint) => boolean) {
    return this.breakPoint$.pipe(
      map((v) => condition(v)),
      distinctUntilChanged()
    );
  }

  columnsQuery(cols: number | { [breakpoint: number]: number }) {
    if (typeof cols === 'number') {
      return this.colSize$.pipe(
        map((size) => size * cols),
        distinctUntilChanged()
      );
    } else {
      const colsOrder = Object.keys(cols)
        .map((k) => parseInt(k))
        .sort();

      return combineLatest({
        bp: this.breakPoint$,
        col: this.colSize$,
      }).pipe(
        map(({ bp, col }) => {
          const match = colsOrder.filter((c) => c <= bp).slice(-1)[0];
          if (match !== undefined) {
            return cols[match] * col;
          } else {
            return 0;
          }
        }),
        distinctUntilChanged()
      );
    }
  }

  heightQuery(multiplier = 1 as number | { [breakpoint: number]: number }) {
    if (typeof multiplier === 'number') {
      return this.height$.pipe(
        map((h) => h * multiplier),
        distinctUntilChanged()
      );
    } else {
      const colsOrder = Object.keys(multiplier)
        .map((k) => parseInt(k))
        .sort();

      return combineLatest({
        bp: this.breakPoint$,
        height: this.height$,
      }).pipe(
        map(({ bp, height }) => {
          const match = colsOrder.filter((c) => c <= bp).slice(-1)[0];
          if (match !== undefined) {
            return multiplier[match] * height;
          } else {
            return 0;
          }
        }),
        distinctUntilChanged()
      );
    }
  }
}
