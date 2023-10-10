import { TestBed } from '@angular/core/testing';

import { ArtFormsService } from './art-forms.service';

describe('ArtFormsService', () => {
  let service: ArtFormsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ArtFormsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
