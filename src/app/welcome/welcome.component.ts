import { Component, inject } from '@angular/core';
import { BrowserStorageService } from '../browser-storage.service';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from '@auth0/auth0-angular';
import { map } from 'rxjs';

export const WELCOMED_KEY = 'hasBeenWelcomed';

@Component({
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
