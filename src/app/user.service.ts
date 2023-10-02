import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { AuthService, User } from '@auth0/auth0-angular';
import { JSONData } from '@xata.io/client';
import { combineLatest, map, of, switchMap } from 'rxjs';
import type { ArtFormsPointsRecord, PointsRecord } from 'xata';
import { ArtFormsService } from './art-forms.service';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  constructor(private http: HttpClient, private artForms: ArtFormsService) {
    this.artForms.queryArtForms();
  }

  sendFeedback(feedback: {feedback_type: string, description: string}) {
    return this.http.post('/.netlify/functions/feedback', feedback)
  }

  updateUserData(
    data: Partial<User> & {
      avatarBase64?: { mediaType: string; base64Content: string } | null;
    }
  ) {
    return this.http.post('/.netlify/functions/update_user', data);
  }

  resetPassword() {
    return this.http.post('/.netlify/functions/reset_password', {});
  }

  deleteAccount(reason: { reason: string }) {
    return this.http.post('/.netlify/functions/delete_user', reason);
  }

  pointOwnership(subId: string, pointId: string) {
    return this.http.get<boolean>(
      `/.netlify/functions/point_ownership?sub=${subId}&id=${pointId}`
    );
  }

  ownedPoints() {
    return combineLatest({
      descriptions: this.http.get<JSONData<ArtFormsPointsRecord>[]>(
        `/.netlify/functions/owned_points`
      ),
      artForms: this.artForms.fetchedArtForms,
    }).pipe(
      map(({ descriptions, artForms }) =>
        descriptions.reduce(
          (acc, description) => {
            const form = description.form!;

            const af = artForms.find(({ id }) => id === form.id)!;
            const id = description.point!.id!;
            const point_description = acc.get(id) || {
              ...description.point,
              art_forms: [],
            };

            acc.set(id, {
              ...point_description,
              art_forms: [
                ...(point_description?.art_forms || []),
                af.name as string,
              ],
            });

            return acc;
          },
          new Map<
            string,
            Partial<JSONData<PointsRecord>> & {
              art_forms: string[];
            }
          >()
        )
      ),
      map((d) => Array.from(d.values()))
    );
  }
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
