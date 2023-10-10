import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FlagPinComponent } from './flag-pin.component';

describe('FlagPinComponent', () => {
  let component: FlagPinComponent;
  let fixture: ComponentFixture<FlagPinComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [FlagPinComponent]
    });
    fixture = TestBed.createComponent(FlagPinComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
