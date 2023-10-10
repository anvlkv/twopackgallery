import { CommonModule } from '@angular/common';
import { Component, forwardRef } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { ImageCropperModule } from 'ngx-image-cropper';
import { CoverEditorComponent } from '../cover-editor/cover-editor.component';

@Component({
  selector: 'app-tile-editor',
  standalone: true,
  imports: [CommonModule,
    NzUploadModule,
    ImageCropperModule,
    NzButtonModule,
    NzIconModule,
    NzToolTipModule,],
  templateUrl: './tile-editor.component.html',
  styleUrls: ['./tile-editor.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TileEditorComponent),
      multi: true,
    },
  ],
})
export class TileEditorComponent extends CoverEditorComponent {
  override coverRatio: { W_RATIO: number; H_RATIO: number; STR: string; } = {
    W_RATIO: 1,
    H_RATIO: 1,
    STR: '1 / 1'
  };
}
