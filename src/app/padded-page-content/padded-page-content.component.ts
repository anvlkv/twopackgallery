import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzGridModule } from 'ng-zorro-antd/grid';

@Component({
  selector: 'app-padded-page-content',
  standalone: true,
  imports: [CommonModule, NzGridModule],
  templateUrl: './padded-page-content.component.html',
  styleUrls: ['./padded-page-content.component.scss']
})
export class PaddedPageContentComponent {
  @Input('narrow')
  narrow = false;

  sizes = {
    Xs: { span: 22, push: 1 },
    Md: { span: 20, push: 2 },
    Xl: { span: 18, push: 3 },
    XXl: { span: 16, push: 4 },
  }

  narrowSizes: typeof this['sizes'] = {
    Xs: { span: 22, push: 1 },
    Md: { span: 22, push: 1 },
    Xl: { span: 20, push: 2 },
    XXl: { span: 20, push: 2 },
  }
}
