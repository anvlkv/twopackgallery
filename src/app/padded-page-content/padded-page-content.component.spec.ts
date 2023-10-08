import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaddedPageContentComponent } from './padded-page-content.component';

describe('PaddedPageContentComponent', () => {
  let component: PaddedPageContentComponent;
  let fixture: ComponentFixture<PaddedPageContentComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [PaddedPageContentComponent]
    });
    fixture = TestBed.createComponent(PaddedPageContentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
