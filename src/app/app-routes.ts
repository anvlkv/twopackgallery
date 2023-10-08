import { Routes } from '@angular/router';
import { canDeactivateFlagPin } from './flag-pin/flag-pin.component';
import { isAuthenticated } from './isAuthenticated.guard';
import { canDeactivatePinEditor } from './pin-editor/pin-editor.component';
import { canDeactivateCreatePin } from './create-pin/create-pin.component';
import { isPointOwner } from './user.service';
import { canActivateWelcomePage as canActivateWelcomePageOrRedirect } from './welcome/welcome.component';

const internalRoutes: Routes = [
  {
    path: 'create-pin',
    loadComponent: () =>
      import('./create-pin/create-pin.component').then(
        (mod) => mod.CreatePinComponent
      ),
    title: 'New pin',
    canDeactivate: [canDeactivateCreatePin],
    canActivate: [isAuthenticated],
  },
  {
    path: 'pin/:id',
    title: 'View location',
    loadComponent: () =>
      import('./pin/pin.component').then((mod) => mod.PinComponent),
  },
  {
    path: 'pin/:id/edit',
    title: 'Edit location',
    loadComponent: () =>
      import('./pin-editor/pin-editor.component').then(
        (mod) => mod.PinEditorComponent
      ),
    canDeactivate: [canDeactivatePinEditor],
    canActivate: [isAuthenticated, isPointOwner(true, 'id')],
  },
  {
    path: 'pin/:id/flag',
    title: 'Flag location',
    loadComponent: () =>
      import('./flag-pin/flag-pin.component').then(
        (mod) => mod.FlagPinComponent
      ),
    canDeactivate: [canDeactivateFlagPin],
    canActivate: [isAuthenticated, isPointOwner(false, 'id')],
  },
  {
    path: 'search',
    title: 'Search',
    loadComponent:() => import('./search-results/search-results.component').then(
      (mod) => mod.SearchResultsComponent
    ),
  }
];

export const appRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./welcome/welcome.component').then((mod) => mod.WelcomeComponent),
    canActivate: [canActivateWelcomePageOrRedirect],
  },
  {
    path: 'welcome',
    loadComponent: () =>
      import('./welcome/welcome.component').then((mod) => mod.WelcomeComponent),
  },
  {
    path: 'map',
    loadComponent: () =>
      import('./map-layout/map-layout.component').then(
        (mod) => mod.MapLayoutComponent
      ),
    children: [
      ...internalRoutes,
      {
        path: 'pin/:id/not-found',
        title: 'Location not found',
        loadComponent: () =>
          import('./page-not-found/page-not-found.component').then(
            (mod) => mod.PageNotFoundComponent
          ),
      },
    ],
  },
  {
    path: '',
    loadComponent: () =>
      import('./page-layout/page-layout.component').then(
        (mod) => mod.PageLayoutComponent
      ),
    children: [
      ...internalRoutes.map((route) => ({
        ...route,
        data: { ...route.data, fullPage: true },
      })),
      {
        path: 'profile',
        loadComponent: () =>
          import('./user-profile/user-profile.component').then(
            (mod) => mod.UserProfileComponent
          ),
        canActivate: [isAuthenticated],
      },
      {
        path: 'account',
        loadComponent: () =>
          import('./user-account/user-account.component').then(
            (mod) => mod.UserAccountComponent
          ),
        canActivate: [isAuthenticated],
      },
      {
        path: 'feedback',
        loadComponent: () =>
          import('./feedback/feedback.component').then(
            (mod) => mod.FeedbackComponent
          ),
        canActivate: [isAuthenticated],
      },
      {
        path: 'authorize',
        loadComponent: () =>
          import('./authorize/authorize.component').then(
            (mod) => mod.AuthorizeComponent
          ),
      },
    ],
  },
  {
    path: 'error',
    loadComponent: () =>
      import('./fatal-error/fatal-error.component').then(
        (mod) => mod.FatalErrorComponent
      ),
  },
  {
    path: '**',
    loadComponent: () =>
      import('./page-not-found/page-not-found.component').then(
        (mod) => mod.PageNotFoundComponent
      ),
  },
];
