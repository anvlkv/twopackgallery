import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { CanActivateFn, Router, RouterModule } from '@angular/router';
import { AuthService } from '@auth0/auth0-angular';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzResultModule } from 'ng-zorro-antd/result';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { map } from 'rxjs';
import { BrowserStorageService } from '../browser-storage.service';

export const WELCOMED_KEY = 'hasBeenWelcomed';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    NzSpaceModule,
    NzResultModule,
    NzIconModule,
    NzDividerModule,
    NzTypographyModule,
    NzButtonModule
  ],
  selector: 'app-welcome',
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.scss'],
})
export class WelcomeComponent {
  viewTitle = `Hey there, it's time to embark on an artistic adventure together! 🎨`;
  viewSubTitle = `Let's explore the world of art!`;
  rotatedText = [
    'gallery',
    'studio',
    'workshop',
    'collection',
    'art hub',
    'pop-up space',
    'street art',
    'art intervention',
    'museum',
    'creative space',
  ];

  constructor(private storage: BrowserStorageService) {}

  markWelcomed() {
    this.storage.set(WELCOMED_KEY, true);
  }
}

export const canActivateWelcomePage: CanActivateFn = () => {
  const storage = inject(BrowserStorageService);
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.isAuthenticated$.pipe(
    map((authenticated) => {
      return !authenticated && !storage.get(WELCOMED_KEY);
    }),
    map((canActivate) => {
      return canActivate || router.createUrlTree(['/', 'map']);
    })
  );
};
