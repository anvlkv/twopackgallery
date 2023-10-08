import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzAutocompleteModule, AutocompleteDataSourceItem } from 'ng-zorro-antd/auto-complete';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { SearchService } from '../search.service';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NzInputModule, NzAutocompleteModule, NzIconModule],
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss'],
  providers: [SearchService]
})
export class SearchComponent implements OnInit, OnDestroy {
  searchOptions: AutocompleteDataSourceItem[] = [];

  isActivated = false

  search = new FormControl('')

  subs: Subscription[] = [];

  @Input('wideActivated')
  wideActivated = false;

  constructor(private service: SearchService) {
    
  }

  ngOnInit(): void {
    this.subs.push(
      this.search.valueChanges.subscribe(value => {

      })
    )
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe())
  }
  

  onFocus(ev: FocusEvent) {
    this.isActivated = true;
  }

  onBlur(ev: FocusEvent) {
    this.isActivated = false;
  }
}
