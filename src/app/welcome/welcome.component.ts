import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { CanActivateFn, Router, RouterModule } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzResultModule } from 'ng-zorro-antd/result';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
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
    NzButtonModule,
  ],
  selector: 'app-welcome',
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.scss'],
})
export class WelcomeComponent {
  viewTitle = `Every hunter wishes to know where the pheasant sits`;
  viewSubTitle = `Free, fair, and collaborative space for artists from all over the globe`;
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
  const router = inject(Router);

  if (!storage.get(WELCOMED_KEY)) {
    return true;
  } else {
    return router.createUrlTree(['/', 'map']);
  }
};
