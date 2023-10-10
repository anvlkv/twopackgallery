import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TileEditorComponent } from './tile-editor.component';

describe('TileEditorComponent', () => {
  let component: TileEditorComponent;
  let fixture: ComponentFixture<TileEditorComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TileEditorComponent]
    });
    fixture = TestBed.createComponent(TileEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
