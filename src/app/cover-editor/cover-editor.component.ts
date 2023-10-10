import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  forwardRef,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzUploadFile, NzUploadModule } from 'ng-zorro-antd/upload';
import { ImageCroppedEvent, ImageCropperModule } from 'ngx-image-cropper';
import { BehaviorSubject, Subscription, filter, from, map, noop } from 'rxjs';
import { CoverImageComponent } from '../cover-image/cover-image.component';
import { COVER_RATIO } from '../cover-image/consts';
import { NzSpinModule } from 'ng-zorro-antd/spin';

export type Cover =
  | string
  | {
      mediaType: string;
      base64Content: string;
    };

@Component({
  standalone: true,
  imports: [
    CommonModule,
    NzUploadModule,
    ImageCropperModule,
    NzButtonModule,
    NzIconModule,
    NzToolTipModule,
    NzSpinModule,
    CoverImageComponent,
  ],
  selector: 'app-cover-editor',
  templateUrl: './cover-editor.component.html',
  styleUrls: ['./cover-editor.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CoverEditorComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CoverEditorComponent
  implements ControlValueAccessor, OnInit, OnDestroy, AfterViewInit
{
  pictureUrl?: string;
  fb64 = new BehaviorSubject<{
    mediaType: string;
    base64Content: string;
  } | null>(null);

  coverFile: NzUploadFile[] = [];
  coverRatio = COVER_RATIO;
  imageCropped = true;
  subs: Subscription[] = [];
  cropperHint?: string;
  croppedImage?: Blob;
  width = 0;
  disabled = false;
  reading = false;

  constructor(
    private notification: NzNotificationService,
    private el: ElementRef<HTMLDivElement>,
    private ch: ChangeDetectorRef
  ) {}

  writeValue(obj: Cover): void {
    if (typeof obj === 'string') {
      this.pictureUrl = obj;
      this.imageCropped = true;
    } else {
      this.imageCropped = false;
      this.fb64.next(obj);
    }
    this.ch.detectChanges();
  }

  private _onChange: (value: Cover) => void = noop;
  registerOnChange(fn: any): void {
    this._onChange = fn;
  }
  private _onTouched: () => void = noop;
  registerOnTouched(fn: any): void {
    this._onTouched = fn;
  }
  setDisabledState?(isDisabled: boolean): void {
    this.disabled = isDisabled;
    this.ch.detectChanges();
  }

  ngOnInit(): void {
    this.subs.push(
      this.fb64.pipe(filter(Boolean)).subscribe((d) => {
        this.pictureUrl = `data:${d!.mediaType};base64,${d!.base64Content}`;
        this.ch.detectChanges();
      })
    );

    this.subs.push(
      this.fb64
        .pipe(
          filter(Boolean),
          filter(() => this.imageCropped)
        )
        .subscribe((data) => {
          this._onChange(data);
          this.ch.detectChanges();
        })
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
  }

  ngAfterViewInit(): void {
    this.width = this.el.nativeElement.clientWidth;
    this.ch.detectChanges()
  }

  onCropperReady() {
    this.cropperHint = 'You may adjust how the image is cropped and scaled.';
  }

  onImageLoadFailed() {
    this.notification.error(
      'Could not open the uploaded image.',
      'Please try again or choose a different file.'
    );
    this.clearImage();
  }

  onImageCropped(ev: ImageCroppedEvent) {
    this.croppedImage = ev.blob || undefined;
    this.ch.detectChanges()
  }

  clearImage() {
    this.pictureUrl = undefined;
    this.fb64.next(null);
    this.coverFile = [];
    this.imageCropped = false;
    this._onTouched();
        this.ch.detectChanges()

    return false;
  }

  acceptCropped() {
    this.imageCropped = true;
    this.fb64FromArrayBuffer(this.croppedImage!, this.croppedImage!.type);
    return false;
  }

  private fb64FromArrayBuffer(data: File | Blob, mediaType: string) {
    from(data.arrayBuffer())
      .pipe(
        map((arrayBuffer) => {
          const base64 = btoa(
            new Uint8Array(arrayBuffer).reduce(
              (data, byte) => data + String.fromCharCode(byte),
              ''
            )
          );

          return {
            mediaType,
            base64Content: base64,
          };
        })
      )
      .subscribe((d) => {
        this.fb64.next(d)
        this.reading = false;
        this.ch.detectChanges()
      });
  }

  beforeUploadCover = (file: NzUploadFile) => {
    this.coverFile = [file];
    this.imageCropped = false;
    const data = file as unknown as File;
    this.fb64FromArrayBuffer(data, data.type);
    this._onTouched();
    this.reading = true;
    this.ch.detectChanges();
    return false;
  };
}
