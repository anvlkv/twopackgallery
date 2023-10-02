import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-pin-card',
  templateUrl: './pin-card.component.html',
  styleUrls: ['./pin-card.component.scss'],
})
export class PinCardComponent {
  @Input('data')
  data!: {
    title: string;
    description: string;
    id: string;
    cover: { url: string };
  };
}
