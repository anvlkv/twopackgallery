import { NgModule, inject, isDevMode } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';
import { PinComponent } from './pin/pin.component';
import {
  PinEditorComponent,
  canDeactivatePinEditor,
} from './pin-editor/pin-editor.component';
import { MapLayoutComponent } from './map-layout/map-layout.component';
import { FlagPinComponent } from './flag-pin/flag-pin.component';
import { PageLayoutComponent } from './page-layout/page-layout.component';
import { UserProfileComponent } from './user-profile/user-profile.component';
import { UserAccountComponent } from './user-account/user-account.component';
import { isAuthenticated } from './isAuthenticated.guard';
import { FatalErrorComponent } from './fatal-error/fatal-error.component';

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
    canActivate: [isAuthenticated],
  },
  {
    path: 'pin/:id/flag',
    title: 'Flag location',
    component: FlagPinComponent,
    canActivate: [isAuthenticated],
  },
];

const routes: Routes = [
  {
    path: '',
    redirectTo: 'map',
    pathMatch: 'full',
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
    ],
  },
  {
    path: 'error',
    component: FatalErrorComponent
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
      // TODO: should use 'enabled' or 'enabledBlocking' for SSR
      initialNavigation: 'disabled',
    }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
