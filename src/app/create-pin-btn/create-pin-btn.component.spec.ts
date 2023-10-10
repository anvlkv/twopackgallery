import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreatePinBtnComponent } from './create-pin-btn.component';

describe('CreatePinBtnComponent', () => {
  let component: CreatePinBtnComponent;
  let fixture: ComponentFixture<CreatePinBtnComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CreatePinBtnComponent]
    });
    fixture = TestBed.createComponent(CreatePinBtnComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
