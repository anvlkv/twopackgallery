import { CommonModule, NgOptimizedImage } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import { COVER_RATIO } from './consts';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    NgOptimizedImage,
    NzSkeletonModule,
  ],
  selector: 'app-cover-image',
  templateUrl: './cover-image.component.html',
  styleUrls: ['./cover-image.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CoverImageComponent implements AfterViewInit, OnChanges {
  @Input('src')
  src!: string;

  @Input('b64')
  isBase64 = false;

  @Input('alt')
  alt?: string;

  width?: number;
  height?: number;

  ratio = COVER_RATIO.STR;

  loading = true;

  constructor(
    private el: ElementRef<HTMLDivElement>,
    private ch: ChangeDetectorRef
  ) {}

  ngAfterViewInit(): void {
    this.computeSize();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (Object.values(changes).some((ch) => !ch.firstChange)) {
      this.ch.detectChanges();
    }
  }

  onLoad() {
    this.loading = false;
    this.ch.detectChanges();
  }

  private computeSize() {
    const width = this.el.nativeElement.clientWidth;

    this.width = width;
    this.height = (width / COVER_RATIO.W_RATIO) * COVER_RATIO.H_RATIO;
    this.ch.detectChanges();
  }
}
