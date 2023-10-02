import { NgModule, isDevMode } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthorizeComponent } from './authorize/authorize.component';
import { FatalErrorComponent } from './fatal-error/fatal-error.component';
import { FeedbackComponent } from './feedback/feedback.component';
import {
  FlagPinComponent,
  canDeactivateFlagPin,
} from './flag-pin/flag-pin.component';
import { isAuthenticated } from './isAuthenticated.guard';
import { MapLayoutComponent } from './map-layout/map-layout.component';
import { PageLayoutComponent } from './page-layout/page-layout.component';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';
import {
  PinEditorComponent,
  canDeactivatePinEditor,
} from './pin-editor/pin-editor.component';
import { PinComponent } from './pin/pin.component';
import { UserAccountComponent } from './user-account/user-account.component';
import { UserProfileComponent } from './user-profile/user-profile.component';
import { isPointOwner } from './user.service';
import { WelcomeComponent, canActivateWelcomePage as canActivateWelcomePageOrRedirect } from './welcome/welcome.component';

const internalRoutes: Routes = [
  {
    path: 'create-pin',
    component: PinEditorComponent,
    title: 'New location',
    canDeactivate: [canDeactivatePinEditor],
    canActivate: [isAuthenticated],
  },
  {
    path: 'pin/:id',
    title: 'View location',
    component: PinComponent,
  },
  {
    path: 'pin/:id/edit',
    title: 'Edit location',
    component: PinEditorComponent,
    canDeactivate: [canDeactivatePinEditor],
    canActivate: [isAuthenticated, isPointOwner(true, 'id')],
  },
  {
    path: 'pin/:id/flag',
    title: 'Flag location',
    component: FlagPinComponent,
    canDeactivate: [canDeactivateFlagPin],
    canActivate: [isAuthenticated, isPointOwner(false, 'id')],
  },
];

const routes: Routes = [
  {
    path: '',
    component: WelcomeComponent,
    canActivate: [canActivateWelcomePageOrRedirect]
  },
  {
    path: 'map',
    component: MapLayoutComponent,
    children: [
      ...internalRoutes,
      {
        path: 'pin/:id/not-found',
        title: 'Location not found',
        component: PageNotFoundComponent,
      },
    ],
  },
  {
    path: '',
    component: PageLayoutComponent,
    children: [
      ...internalRoutes.map((route) => ({
        ...route,
        data: { ...route.data, fullPage: true },
      })),
      {
        path: 'profile',
        component: UserProfileComponent,
        canActivate: [isAuthenticated],
      },
      {
        path: 'account',
        component: UserAccountComponent,
        canActivate: [isAuthenticated],
      },
      {
        path: 'feedback',
        component: FeedbackComponent,
        canActivate: [isAuthenticated],
      },
      {
        path: 'authorize',
        component: AuthorizeComponent,
      },
    ],
  },
  {
    path: 'error',
    component: FatalErrorComponent,
  },
  {
    path: '**',
    component: PageNotFoundComponent,
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      enableTracing: isDevMode(),
    }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
