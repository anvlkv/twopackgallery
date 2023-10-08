import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserTagComponent } from './user-tag.component';

describe('UserTagComponent', () => {
  let component: UserTagComponent;
  let fixture: ComponentFixture<UserTagComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [UserTagComponent]
    });
    fixture = TestBed.createComponent(UserTagComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
