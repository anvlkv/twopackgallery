import { Injectable } from '@angular/core';
import { BehaviorSubject, distinctUntilChanged, filter, map } from 'rxjs';

const MIN_ZOOM = 0;
const MAX_ZOOM = 20;

@Injectable({
  providedIn: 'root',
})
export class ZoomSyncService {
  private zoom$ = new BehaviorSubject(undefined as number | undefined);

  zoom = this.zoom$.pipe(
    distinctUntilChanged(),
    filter((v) => v !== undefined),
    map((value) => ({
      value: value as number,
      canZoomIn: value! < MAX_ZOOM,
      canZoomOut: value! > MIN_ZOOM,
    }))
  );

  constructor() {}

  zoomIn(increment = 1) {
    const current = this.zoom$.getValue() || 0;
    this.setZoom(current + increment);
  }
  zoomOut(increment = 1) {
    const current = this.zoom$.getValue() || 0;
    this.setZoom(current - increment);
  }
  setZoom(value: number) {
    this.zoom$.next(Math.max(Math.min(value, MAX_ZOOM), MIN_ZOOM));
  }
  getZoom() {
    return this.zoom$.getValue() || 0;
  }
}
