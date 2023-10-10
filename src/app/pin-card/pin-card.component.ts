import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { JSONData } from '@xata.io/client';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { PointsRecord } from 'xata';
import { CoverImageComponent } from '../cover-image/cover-image.component';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    NzCardModule,
    CoverImageComponent,
    NzIconModule,
    NzButtonModule,
  ],
  selector: 'app-pin-card',
  templateUrl: './pin-card.component.html',
  styleUrls: ['./pin-card.component.scss'],
})
export class PinCardComponent {
  @Input('data')
  data!: JSONData<PointsRecord> | any;

  @Input('showExtra')
  showExtra?: 'top' | 'bottom' | false;

  @Input('nzHoverable')
  nzHoverable = false;

  @Input('highlight')
  highlight = false;

  @Output('onClick')
  click = new EventEmitter();

  onClick(ev: MouseEvent) {
    ev.preventDefault();
    ev.stopPropagation();
    this.click.emit(this.data);
    return false;
  }
}
