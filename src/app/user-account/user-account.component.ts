import { CommonModule } from '@angular/common';
import {
  Component,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { AuthClientConfig, AuthService, User } from '@auth0/auth0-angular';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzModalRef, NzModalService } from 'ng-zorro-antd/modal';
import {
  NzNotificationModule,
  NzNotificationService,
} from 'ng-zorro-antd/notification';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzUploadFile, NzUploadModule } from 'ng-zorro-antd/upload';
import {
  BehaviorSubject,
  Subject,
  Subscription,
  filter,
  from,
  map,
  switchMap,
  take,
  timer,
} from 'rxjs';
import { PaddedPageContentComponent } from '../padded-page-content/padded-page-content.component';
import { UserService } from '../user.service';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    NzFormModule,
    ReactiveFormsModule,
    NzButtonModule,
    NzSpaceModule,
    NzUploadModule,
    NzInputModule,
    NzDividerModule,
    NzAvatarModule,
    NzNotificationModule,
    NzAlertModule,
    PaddedPageContentComponent,
  ],
  selector: 'app-user-account',
  templateUrl: './user-account.component.html',
  styleUrls: ['./user-account.component.scss'],
})
export class UserAccountComponent implements OnInit, OnDestroy {
  fb64 = new BehaviorSubject<{
    mediaType: string;
    base64Content: string;
  } | null>(null);
  userForm = this.fb.group({
    name: [
      '',
      Validators.compose([Validators.required, Validators.minLength(2)]),
    ],
    tag: this.fb.control('', {
      validators: [
        ({ value }: AbstractControl<string>) => {
          if (/[^a-z0-9]/.test(value || '')) {
            return { InvalidTag: true };
          } else {
            return null;
          }
        },
      ],
      asyncValidators: [this.user.validateTag],
    }),
    email: ['', Validators.compose([Validators.required, Validators.email])],
    avatarBase64: [null as null | { mediaType: string; base64Content: string }],
  });
  deleteForm = this.fb.group({
    reason: [
      '',
      Validators.compose([Validators.required, Validators.minLength(10)]),
    ],
  });

  avatarFile: NzUploadFile[] = [];
  avatarUrl?: string;
  subs: Subscription[] = [];
  saving = false;
  verified?: boolean;

  @ViewChild('deleteAccount')
  deleteAccountTemplate!: TemplateRef<any>;

  deleteModalRef?: NzModalRef;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private authConfig: AuthClientConfig,
    private user: UserService,
    private notification: NzNotificationService,
    private modal: NzModalService
  ) {
    this.userForm.disable();
  }

  ngOnInit(): void {
    this.subs.push(
      this.fb64.pipe(filter(Boolean)).subscribe((d) => {
        const { mediaType, base64Content } = d!;
        this.avatarUrl = `data:${mediaType};base64,${base64Content}`;
        this.userForm.controls['avatarBase64'].setValue({
          mediaType,
          base64Content,
        });
      })
    );

    this.subs.push(
      this.user.user.pipe(filter(Boolean)).subscribe(({ user, ...account }) => {
        this.userForm.reset({
          name: account.name,
          email: account.email,
          tag: user?.tag as string,
        });

        this.avatarUrl = account.picture;
        this.verified = user?.status === 'verified';
        this.userForm.enable();
      })
    );

    this.subs.push(
      this.deleteForm.statusChanges.subscribe((status) => {
        if (this.deleteModalRef) {
          this.deleteModalRef.updateConfig({
            nzOkDisabled: status !== 'VALID',
          });
        }
      })
    );
  }

  resentVerification?: number;
  resendVerification() {
    this.resentVerification = 30;
    this.subs.push(
      this.user.resendVerification().subscribe({
        next: () => {
          this.notification.info(
            'Message sent',
            'Please check your inbox and spam folders'
          );
          timer((this.resentVerification as number) * 1000, 1000)
            .pipe(take(this.resentVerification!))
            .subscribe(() => {
              this.resentVerification = (this.resentVerification as number) - 1;
            });
        },
        error: (e) => {
          this.resentVerification = undefined;
          this.notification.error('Something went wrong...', e.message);
        },
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
  }

  handleTagInput(ev: Event) {
    const input = ev.target as HTMLInputElement;
    input.value = input.value.replace(/[^a-z0-9]/g, '');
    return ev;
  }

  beforeUploadAvatar = (file: NzUploadFile) => {
    const data = file as unknown as File;
    this.fb64FromArrayBuffer(data, data.type);
    return false;
  };

  private fb64FromArrayBuffer(data: File | Blob, mediaType: string) {
    from(data.arrayBuffer())
      .pipe(
        map((arrayBuffer) => {
          const base64 = btoa(
            new Uint8Array(arrayBuffer).reduce(
              (data, byte) => data + String.fromCharCode(byte),
              ''
            )
          );

          return {
            mediaType,
            base64Content: base64,
          };
        })
      )
      .subscribe((d) => this.fb64.next(d));
  }

  submitSubscription?: Subscription;
  onSubmit() {
    if (!this.userForm.valid) {
      return;
    }
    this.saving = true;
    this.submitSubscription = this.user
      .updateUserData(this.userForm.value as Partial<User>)
      .subscribe({
        next: () => {
          this.saving = false;
          this.notification.success(
            'Changes saved',
            'Your account details were updated.\n This page will reload now...'
          );
          this.reload();
        },
        error: (error) => {
          this.saving = false;
          this.notification.error('Something went wrong...', error.message);
        },
        complete: () => {
          this.saving = false;
          console.log('completed');
        },
      });
  }

  onReset() {
    this.submitSubscription?.unsubscribe();
    this.userForm.reset();
    return false;
  }

  onResetPassword() {
    this.saving = true;
    this.user.resetPassword().subscribe({
      next: () => {
        this.notification.success(
          'Resetting your password.',
          'Email with further instructions for resetting your password was sent.'
        );
        timer(10000).subscribe(() => {
          this.saving = false;
        })
      },
      error: (err) => {
        this.notification.error('Something went wrong...', err.message);
      },
    });
  }

  onDeleteAccount() {
    const delete$ = new Subject<boolean>();
    this.deleteModalRef = this.modal.confirm({
      nzTitle: 'Delete account',
      nzContent: this.deleteAccountTemplate,
      nzOkDanger: true,
      nzOkDisabled: this.deleteForm.invalid,
      nzOnCancel: () => delete$.next(false),
      nzOnOk: () => delete$.next(true),
    });

    delete$
      .pipe(
        filter(Boolean),
        switchMap(() => {
          return this.user.deleteAccount(
            this.deleteForm.value as { reason: string }
          );
        })
      )
      .subscribe({
        next: () => {
          this.notification.success(
            'Deleting your account.',
            'All done. This page will exit now...'
          );
          this.logOut();
        },
        error: (err) => {
          this.notification.error('Something went wrong...', err.message);
        },
      });
  }

  private reload() {
    timer(1500).subscribe(() => {
      window.location.reload();
    });
  }
  private logOut() {
    const returnTo = this.authConfig.get()?.authorizationParams?.redirect_uri;
    timer(1500).subscribe(() => {
      this.auth.logout({ logoutParams: { returnTo } })
    });
  }
}
