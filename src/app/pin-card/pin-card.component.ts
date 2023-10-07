import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { CoverImageComponent } from '../cover-image/cover-image.component';
import { JSONData } from '@xata.io/client';
import { UsersPointsRecord } from 'xata';

@Component({
  standalone: true,
  imports: [NzCardModule, RouterModule, CoverImageComponent, NzIconModule, NzButtonModule],
  selector: 'app-pin-card',
  templateUrl: './pin-card.component.html',
  styleUrls: ['./pin-card.component.scss'],
})
export class PinCardComponent {
  @Input('data')
  data!: JSONData<UsersPointsRecord> | any;
}
