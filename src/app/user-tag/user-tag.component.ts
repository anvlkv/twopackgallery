import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserType } from '../user.service';

@Component({
  selector: 'app-user-tag',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-tag.component.html',
  styleUrls: ['./user-tag.component.scss'],
})
export class UserTagComponent implements OnChanges {
  @Input('user')
  user?: string | UserType | null;

  view_tag = '';

  ngOnChanges(changes: SimpleChanges): void {
    const value: string | UserType | null | undefined =
      changes['user'].currentValue;

    this.view_tag = '';

    if (value && typeof value === 'object') {
      if (value['tag']) {
        this.view_tag = `@${value['tag']}`;
      }
    } else if (typeof value === 'string') {
      this.view_tag = value;
    }
  }
}
