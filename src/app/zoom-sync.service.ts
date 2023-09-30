import { Injectable } from '@angular/core';
import { BehaviorSubject, distinct, map } from 'rxjs';

const MIN_ZOOM = 0;
const MAX_ZOOM = 20;

@Injectable({
  providedIn: 'root',
})
export class ZoomSyncService {
  private zoom$ = new BehaviorSubject(15);

  zoom = this.zoom$.pipe(
    distinct(),
    map((value) => ({
      value,
      canZoomIn: value < MAX_ZOOM,
      canZoomOut: value > MIN_ZOOM,
    }))
  );

  constructor() {}

  zoomIn() {
    const current = this.zoom$.getValue();
    this.setZoom(current + 1);
  }
  zoomOut() {
    const current = this.zoom$.getValue();
    this.setZoom(current - 1);
  }
  setZoom(value: number) {
    this.zoom$.next(Math.max(Math.min(value, MAX_ZOOM), MIN_ZOOM));
  }
}
