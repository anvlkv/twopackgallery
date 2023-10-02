import { Component, OnDestroy, OnInit } from '@angular/core';
import { UserService } from '../user.service';
import { Subscription } from 'rxjs';
import { JSONData } from '@xata.io/client';
import type { PointsRecord } from 'xata';
import { AuthService } from '@auth0/auth0-angular';
import { COVER_RATIO } from '../cover-image/cover-image.component';

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.scss'],
})
export class UserProfileComponent implements OnInit, OnDestroy {
  subs: Subscription[] = [];

  descriptions?: any;

  coverRatio = COVER_RATIO.STR

  constructor(private user: UserService, public auth: AuthService) {}

  ngOnInit(): void {
    this.subs.push(
      this.user.ownedPoints().subscribe((d) => {
        this.descriptions = d;
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
  }
}
