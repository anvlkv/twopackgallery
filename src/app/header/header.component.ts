import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import {
  ActivatedRoute,
  EventType,
  Router,
  RouterModule,
} from '@angular/router';
import { AuthService } from '@auth0/auth0-angular';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { AvatarComponent } from '../avatar/avatar.component';
import { Subscription } from 'rxjs';
import { environment } from 'src/environments/environment';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    NzCardModule,
    NzSpaceModule,
    NzTypographyModule,
    NzDropDownModule,
    NzButtonModule,
    NzDividerModule,
    AvatarComponent,
  ],
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit, OnDestroy {
  @Input('card')
  isCard?: boolean;

  returnTo: string;
  subs: Subscription[] = [];
  logoLink = ['/', 'map'];

  constructor(public auth: AuthService, private router: Router) {
    this.returnTo = environment.auth0.redirect_uri;
  }

  ngOnInit(): void {
    this.subs.push(
      this.router.events.subscribe((ev) => {
        if (ev.type === EventType.NavigationEnd) {
          if (ev.url.endsWith('map')) {
            this.logoLink = ['/', 'welcome'];
          } else {
            this.logoLink = ['/', 'map'];
          }
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
  }
}
