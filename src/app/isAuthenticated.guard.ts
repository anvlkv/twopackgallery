import { inject } from '@angular/core';
import { CanActivateFn, ActivatedRouteSnapshot, Params } from '@angular/router';
import { AuthService } from '@auth0/auth0-angular';
import { skipWhile, switchMap, of, map } from 'rxjs';
import { BrowserStorageService } from './browser-storage.service';

export const AUTH_REDIRECTS_KEY = 'auth_redirects';

export interface IRedirects {
  urlPaths: string[];
  query: Params;
}

export const isAuthenticated: CanActivateFn = (
  route: ActivatedRouteSnapshot
) => {
  const auth = inject(AuthService);
  const storage = inject(BrowserStorageService);

  return auth.isLoading$.pipe(
    skipWhile(Boolean),
    switchMap(() =>
      auth.isAuthenticated$.pipe(
        switchMap((isAuthenticated) => {
          if (isAuthenticated) {
            return of(true);
          } else {
            storage.set(AUTH_REDIRECTS_KEY, {
              urlPaths: ['/', ...route.url.map(({ path }) => path)],
              query: route.queryParams,
            } as IRedirects);

            return auth.loginWithRedirect().pipe(map(() => false));
          }
        })
      )
    )
  );
};
