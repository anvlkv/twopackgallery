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

const W_RATIO = 100;
const H_RATIO = 30;

export const COVER_RATIO = { W_RATIO, H_RATIO, STR: `${W_RATIO} / ${H_RATIO}` };

@Component({
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

  private computeSize() {
    const width = this.el.nativeElement.clientWidth;

    this.width = width;
    this.height = (width / W_RATIO) * H_RATIO;
    this.ch.detectChanges();
  }
}
