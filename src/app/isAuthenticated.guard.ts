import { inject } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  Params,
  Router
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

export const restoreAuthenticatedRoute: CanActivateFn = () => {
  const auth = inject(AuthService);
  const storage = inject(BrowserStorageService);
  const router = inject(Router);

  const restore = storage.get<IRedirects>(AUTH_REDIRECTS_KEY);

  if (!restore) {
    return true;
  }

  return auth.isLoading$.pipe(
    skipWhile(Boolean),
    switchMap(() =>
      auth.isAuthenticated$.pipe(
        map((isAuthenticated) => {
          if (!isAuthenticated) {
            return true;
          } else {
            storage.remove(AUTH_REDIRECTS_KEY)
            return router.createUrlTree(restore.urlPaths, {
              queryParams: restore.query,
            });
          }
        })
      )
    )
  );
};
