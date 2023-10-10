import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PinEditorComponent } from './pin-editor.component';

describe('PinEditorComponent', () => {
  let component: PinEditorComponent;
  let fixture: ComponentFixture<PinEditorComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PinEditorComponent]
    });
    fixture = TestBed.createComponent(PinEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
