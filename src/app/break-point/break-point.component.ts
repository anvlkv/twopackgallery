import {
  AfterViewChecked,
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { BreakPointService, EBreakPoint } from '../break-point.service';

@Component({
  selector: 'app-break-point',
  standalone: true,
  imports: [CommonModule, NzGridModule],
  templateUrl: './break-point.component.html',
  styleUrls: ['./break-point.component.scss'],
  host: {ngSkipHydration: 'true'}
})
export class BreakPointComponent implements AfterViewInit {
  @ViewChild('nzXs')
  nzXs!: ElementRef<HTMLDivElement>;
  @ViewChild('nzSm')
  nzSm!: ElementRef<HTMLDivElement>;
  @ViewChild('nzMd')
  nzMd!: ElementRef<HTMLDivElement>;
  @ViewChild('nzLg')
  nzLg!: ElementRef<HTMLDivElement>;
  @ViewChild('nzXl')
  nzXl!: ElementRef<HTMLDivElement>;
  @ViewChild('nzXXl')
  nzXXl!: ElementRef<HTMLDivElement>;
  
  @ViewChild('nzCol')
  nzCol!: ElementRef<HTMLDivElement>;

  @HostListener('window:resize')
  onResize() {
    this.updateMeasurements();
  }

  constructor(private service: BreakPointService) {}

  ngAfterViewInit(): void {
    this.updateMeasurements();
  }

  updateMeasurements() {
    switch (true) {
      case this.nzXs.nativeElement.clientWidth > 0: {
        this.service.setBreakPoint(EBreakPoint.Xs);
        break;
      }
      case this.nzSm.nativeElement.clientWidth > 0: {
        this.service.setBreakPoint(EBreakPoint.Sm);
        break;
      }
      case this.nzMd.nativeElement.clientWidth > 0: {
        this.service.setBreakPoint(EBreakPoint.Md);
        break;
      }
      case this.nzLg.nativeElement.clientWidth > 0: {
        this.service.setBreakPoint(EBreakPoint.Lg);
        break;
      }
      case this.nzXl.nativeElement.clientWidth > 0: {
        this.service.setBreakPoint(EBreakPoint.Xl);
        break;
      }
      case this.nzXXl.nativeElement.clientWidth > 0: {
        this.service.setBreakPoint(EBreakPoint.XXl);
        break;
      }
      default: {
        break;
      }
    }
    this.service.setColSize(this.nzCol.nativeElement.clientWidth)
    this.service.setHeight(this.nzCol.nativeElement.clientHeight)
  }
}
