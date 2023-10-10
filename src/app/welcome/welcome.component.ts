import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CanActivateFn, Router, RouterModule } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzResultModule } from 'ng-zorro-antd/result';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { BrowserStorageService } from '../browser-storage.service';
import { BreakPointService, EBreakPoint } from '../break-point.service';
import { Subscription } from 'rxjs';

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
export class WelcomeComponent implements OnInit, OnDestroy {
  viewTitle = `Every hunter wishes to know where the pheasant sits`;
  viewSubTitle = `A tool for those who hunts for works art and those who create them`;
  createPinLink = ['/', 'map', 'create-pin'];

  subs: Subscription[] = [];

  constructor(
    private storage: BrowserStorageService,
    private bp: BreakPointService
  ) {}

  ngOnInit(): void {
    this.subs.push(
      this.bp
        .query((bp) => bp < EBreakPoint.Md)
        .subscribe((mobile) => {
          if (mobile) {
            this.createPinLink = ['/', 'create-pin'];
          } else {
            this.createPinLink = ['/', 'map', 'create-pin'];
          }
        })
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
  }

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
