import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import {
  ActivatedRoute,
  EventType,
  Router,
  RouterModule,
} from '@angular/router';
import { AuthClientConfig, AuthService } from '@auth0/auth0-angular';
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
  host: { ngSkipHydration: 'true' },
})
export class HeaderComponent implements OnInit, OnDestroy {
  @Input('card')
  isCard?: boolean;

  subs: Subscription[] = [];
  logoLink = ['/', 'map'];
  currentLink?: string;
  redirect_uri?: string;

  constructor(public auth: AuthService, private authConfig: AuthClientConfig, private router: Router, private activatedRoute: ActivatedRoute) {

  }

  ngOnInit(): void {
    this.subs.push(
      this.router.events.subscribe((ev) => {
        if (ev.type === EventType.NavigationEnd) {
          this.currentLink = ev.url;
          if (ev.url.split('?')[0].endsWith('map')) {
            this.logoLink = ['/', 'welcome'];
          } else {
            this.logoLink = ['/', 'map'];
          }
        }
      })
    );

    
    this.subs.push(
      this.activatedRoute.url.subscribe(url => {
        const base = this.authConfig.get().authorizationParams?.redirect_uri
        this.redirect_uri = `${base}${url.at(0) ? `/${url[0].path}`:''}`
      })
    )
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
  }

  login(ev: MouseEvent) {
    
    this.auth.loginWithRedirect({ authorizationParams: { redirect_uri: this.redirect_uri }, appState: { target: this.currentLink } });
    return false;
  }

  logout(ev: MouseEvent)  {
    
    this.auth.logout({logoutParams: {returnTo: this.redirect_uri }})
    return false;
  }
}
