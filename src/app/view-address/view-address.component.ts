import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Address } from '../location.service';

@Component({
  selector: 'app-view-address',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './view-address.component.html',
  styleUrls: ['./view-address.component.scss']
})
export class ViewAddressComponent implements OnChanges {
  @Input('address')
  address?: Address

  viewAddress?: string;

  isVague = false

  ngOnChanges(changes: SimpleChanges): void {
    const address = changes['address'].currentValue;
    if(address) {
      this.viewAddress = [
        address.address_1,
        address.address_2,
        address.place,
        address.region,
        address.country,
        address.postcode,
      ]
        .filter(Boolean)
        .join(', ');

      this.isVague = !address.address_1;
    }
  }
}
