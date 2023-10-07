import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { AbstractControl, AsyncValidatorFn } from '@angular/forms';
import { CanActivateFn } from '@angular/router';
import { AuthService, User } from '@auth0/auth0-angular';
import type { JSONData } from '@xata.io/client';
import { BehaviorSubject, map, of, skipUntil, switchMap } from 'rxjs';
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
  private user$ = new BehaviorSubject(null as null | UserType);
  user = this.user$.asObservable();
  verified = new BehaviorSubject(true);

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
        this.verified.next(!!u && u['user'].status === 'verified');
      });
  }

  sendFeedback(feedback: { feedback_type: string; description: string }) {
    return this.http.post('/.netlify/functions/authorized-feedback', feedback);
  }

  onAddOwnership(ownership: JSONData<UsersPointsRecord>) {
    const user = this.user$.getValue() as UserType;

    user.ownerships!.push(ownership as any);

    this.user$.next({ ...user });
  }
  onRemoveOwnership(id: string) {
    const user = this.user$.getValue() as UserType;

    user.ownerships = user.ownerships!.filter(({id: pointId}) => pointId !== id);

    this.user$.next({ ...user });
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

  validateTag: AsyncValidatorFn = (control: AbstractControl<string>) => {
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

    return userService.user.pipe(
      map((user) => {
        if (!user) {
          return false;
        } else {
          const id = route.params[param];
          return (
            Boolean(user.ownerships?.find(({ point }) => point?.id === id)) ===
            requirement
          );
        }
      })
    );
  };
