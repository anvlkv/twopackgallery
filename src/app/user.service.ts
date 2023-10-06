import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { AbstractControl, AsyncValidatorFn } from '@angular/forms';
import { CanActivateFn } from '@angular/router';
import { AuthService, User } from '@auth0/auth0-angular';
import type { JSONData } from '@xata.io/client';
import { BehaviorSubject, map, of, switchMap } from 'rxjs';
import type { UsersPointsRecord, UsersRecord } from 'xata';

export type UserType = User &
  JSONData<{
    user: UsersRecord;
    ownerships: UsersPointsRecord[];
    contributions: UsersPointsRecord[];
  }>;
@Injectable({
  providedIn: 'root',
})
export class UserService {
  user$ = new BehaviorSubject(null as null | UserType);
  verified = false;

  constructor(private http: HttpClient, private auth: AuthService) {
    this.auth.user$
      .pipe(
        switchMap((user) => {
          if (!user) {
            return of(null);
          } else {
            return this.http
              .get<JSONData<UserType>>(
                '/.netlify/functions/authorized-user_data'
              )
              .pipe(
                map((data) => ({
                  ...data,
                  ...user,
                }))
              );
          }
        })
      )
      .subscribe((u) => {
        this.user$.next(u as null | JSONData<UserType>);
        this.verified = !!u && u['user'].status === 'verified';
      });
  }

  sendFeedback(feedback: { feedback_type: string; description: string }) {
    return this.http.post('/.netlify/functions/authorized-feedback', feedback);
  }

  updateUserData(
    data: Partial<User> & {
      avatarBase64?: { mediaType: string; base64Content: string } | null;
      tag?: string;
    }
  ) {
    return this.http.post('/.netlify/functions/authorized-update_user', data);
  }

  resendVerification() {
    return this.http.post(
      '/.netlify/functions/authorized-resend_verification',
      {}
    );
  }

  resetPassword() {
    return this.http.post('/.netlify/functions/authorized-reset_password', {});
  }

  deleteAccount(reason: { reason: string }) {
    return this.http.post('/.netlify/functions/authorized-delete_user', reason);
  }

  pointOwnership(subId: string, pointId: string) {
    return this.http.get<boolean>(
      `/.netlify/functions/authorized-point_ownership?sub=${subId}&id=${pointId}`
    );
  }

  validateTag: AsyncValidatorFn = async (control: AbstractControl<string>) => {
    return this.http
      .get<boolean>(
        `/.netlify/functions/authorized-validate_tag?tag=${control.value}`
      )
      .pipe(
        map((valid) => {
          if (valid) {
            return null;
          } else {
            return { TagIsNotAccepted: true };
          }
        })
      );
  };
}

export const isPointOwner =
  (requirement: boolean, param: string): CanActivateFn =>
  (route, snapshot) => {
    const userService = inject(UserService);
    const auth = inject(AuthService);

    return auth.user$.pipe(
      switchMap((user) => {
        if (!user) {
          return of(false);
        } else {
          const id = route.params[param];
          return userService
            .pointOwnership(user.sub!, id)
            .pipe(map((owner) => owner === requirement));
        }
      })
    );
  };
