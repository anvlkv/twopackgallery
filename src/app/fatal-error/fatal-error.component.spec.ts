import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FatalErrorComponent } from './fatal-error.component';

describe('FatalErrorComponent', () => {
  let component: FatalErrorComponent;
  let fixture: ComponentFixture<FatalErrorComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [FatalErrorComponent]
    });
    fixture = TestBed.createComponent(FatalErrorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
