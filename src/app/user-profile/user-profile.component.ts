import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { AuthService } from '@auth0/auth0-angular';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { Subscription } from 'rxjs';
import { PinCardComponent } from '../pin-card/pin-card.component';
import { UserService } from '../user.service';
import { COVER_RATIO } from '../cover-image/consts';
import { PointsService } from '../points.service';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    PinCardComponent,
    NzGridModule,
    NzSkeletonModule,
    NzCardModule,
  ],
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.scss'],
})
export class UserProfileComponent implements OnInit, OnDestroy {
  subs: Subscription[] = [];

  descriptions?: any;

  coverRatio = COVER_RATIO.STR

  constructor(private pts: PointsService, public auth: AuthService) {}

  ngOnInit(): void {
    this.subs.push(
      this.pts.ownedPoints().subscribe((d) => {
        this.descriptions = d;
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
  }
}
