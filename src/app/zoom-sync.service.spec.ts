import { TestBed } from '@angular/core/testing';

import { ZoomSyncService } from './zoom-sync.service';

describe('ZoomSyncService', () => {
  let service: ZoomSyncService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ZoomSyncService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
