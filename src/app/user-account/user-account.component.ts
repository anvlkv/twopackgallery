import { CommonModule } from '@angular/common';
import {
  Component,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService, User } from '@auth0/auth0-angular';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzModalRef, NzModalService } from 'ng-zorro-antd/modal';
import { NzNotificationModule, NzNotificationService } from 'ng-zorro-antd/notification';
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
  timer,
} from 'rxjs';
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

  @ViewChild('deleteAccount')
  deleteAccountTemplate!: TemplateRef<any>;

  deleteModalRef?: NzModalRef;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
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
      this.auth.user$.pipe(filter(Boolean)).subscribe((user) => {
        this.userForm.reset({
          name: user.name,
          email: user.email,
        });

        this.avatarUrl = user.picture;
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

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
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
    this.user.resetPassword().subscribe({
      next: () => {
        this.notification.success(
          'Resetting your password.',
          'Email with further instructions for resetting your password was sent.'
        );
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
            'All done. This page will reload now...'
          );
          this.reload();
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
}
