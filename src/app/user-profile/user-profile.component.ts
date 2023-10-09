import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { Subscription } from 'rxjs';
import { COVER_RATIO } from '../cover-image/consts';
import { PaddedPageContentComponent } from '../padded-page-content/padded-page-content.component';
import { PinCardComponent } from '../pin-card/pin-card.component';
import { UserService, UserType } from '../user.service';
import { RouterModule } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    PinCardComponent,
    NzGridModule,
    NzSkeletonModule,
    NzCardModule,
    NzSpaceModule,
    NzTypographyModule,
    NzIconModule,
    NzButtonModule,
    PaddedPageContentComponent,
  ],
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.scss'],
})
export class UserProfileComponent implements OnInit, OnDestroy {
  subs: Subscription[] = [];

  coverRatio = COVER_RATIO.STR;

  userData?: UserType;
  userName?: string;

  constructor(private user: UserService) {}

  ngOnInit(): void {
    this.subs.push(
      this.user.user.subscribe((user) => {
        this.userData = user || undefined;
      })
    );

    this.subs.push(
      this.user.user.subscribe((u) => {
        if (u?.user?.tag) {
          this.userName = `@${u.user.tag}`;
        } else {
          this.userName = u?.name;
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
  }
}
