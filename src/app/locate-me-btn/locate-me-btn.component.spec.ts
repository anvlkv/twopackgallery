import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LocateMeBtnComponent } from './locate-me-btn.component';

describe('LocateMeBtnComponent', () => {
  let component: LocateMeBtnComponent;
  let fixture: ComponentFixture<LocateMeBtnComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [LocateMeBtnComponent]
    });
    fixture = TestBed.createComponent(LocateMeBtnComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
