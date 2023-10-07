import { inject } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  Params,
  RouterStateSnapshot,
} from '@angular/router';
import { AuthClientConfig, AuthService } from '@auth0/auth0-angular';
import { catchError, map, of, skipWhile, switchMap } from 'rxjs';

export const AUTH_REDIRECTS_KEY = 'auth_redirects';

export interface IRedirects {
  urlPaths: string[];
  query: Params;
}

export const isAuthenticated: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const auth = inject(AuthService);
  const authConfig = inject(AuthClientConfig);

  return auth.isLoading$.pipe(
    skipWhile(Boolean),
    switchMap(() =>
      auth.isAuthenticated$.pipe(
        switchMap((isAuthenticated) => {
          if (isAuthenticated) {
            return of(true);
          } else {
            return auth.getAccessTokenSilently().pipe(
              catchError(() =>
                auth.loginWithRedirect({
                  authorizationParams: {
                    redirect_uri: `${
                      authConfig.get()?.authorizationParams?.redirect_uri
                    }${state.url.includes('/map') ? '/map' : ''}`,
                  },
                  appState: {
                    target: state.url,
                  },
                })
              ),
              map((token) => !!token)
            );
          }
        })
      )
    )
  );
};
