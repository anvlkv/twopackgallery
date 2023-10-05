import { inject } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  Params,
  Router,
  RouterStateSnapshot
} from '@angular/router';
import { AuthService } from '@auth0/auth0-angular';
import { map, of, skipWhile, switchMap } from 'rxjs';
import { BrowserStorageService } from './browser-storage.service';

export const AUTH_REDIRECTS_KEY = 'auth_redirects';

export interface IRedirects {
  urlPaths: string[];
  query: Params;
}

export const isAuthenticated: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot,
) => {
  const auth = inject(AuthService);

  return auth.isLoading$.pipe(
    skipWhile(Boolean),
    switchMap(() =>
      auth.isAuthenticated$.pipe(
        switchMap((isAuthenticated) => {
          if (isAuthenticated) {
            return of(true);
          } else {
            return auth.loginWithRedirect({
              appState: {
                target: state.url
              },
              
            }).pipe(map(() => false));
          }
        })
      )
    )
  );
};


