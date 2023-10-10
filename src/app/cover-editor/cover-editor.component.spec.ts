import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CoverEditorComponent } from './cover-editor.component';

describe('CoverEditorComponent', () => {
  let component: CoverEditorComponent;
  let fixture: ComponentFixture<CoverEditorComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CoverEditorComponent]
    });
    fixture = TestBed.createComponent(CoverEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
