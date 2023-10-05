import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzAutocompleteModule, AutocompleteDataSourceItem } from 'ng-zorro-antd/auto-complete';
import { NzIconModule } from 'ng-zorro-antd/icon';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, NzInputModule, NzAutocompleteModule, NzIconModule],
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss']
})
export class SearchComponent {
  searchOptions: AutocompleteDataSourceItem[] = [];

  isActivated = false
  

  onInput(ev: Event) {

  }

  onFocus(ev: FocusEvent) {
    this.isActivated = true;
  }

  onBlur(ev: FocusEvent) {
    this.isActivated = false;
  }
}
