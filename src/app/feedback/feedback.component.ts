import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '@auth0/auth0-angular';
import { Subscription } from 'rxjs';
import { UserService } from '../user.service';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { Router } from '@angular/router';

@Component({
  selector: 'app-feedback',
  templateUrl: './feedback.component.html',
  styleUrls: ['./feedback.component.scss'],
})
export class FeedbackComponent implements OnInit, OnDestroy {
  feedbackForm = this.fb.group({
    email: [''],
    feedback_type: ['', Validators.required],
    description: ['', Validators.required],
  });

  subs: Subscription[] = [];

  saving = false;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private user: UserService,
    private notification: NzNotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.subs.push(
      this.auth.user$.subscribe((user) => {
        this.feedbackForm.controls['email'].setValue(user!.email!);
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
  }

  onSubmit() {
    if (this.feedbackForm.invalid) {
      return;
    }
    this.saving = true;
    this.subs.push(
      this.user.sendFeedback(this.feedbackForm.value as any).subscribe({
        next: () => {
          this.saving = false;
          this.notification.success(
            'Thank you for your message!',
            `The message was sent. We shall get back to you soon.`
          );
          this.router.navigate(['/map']);
        },
        error: (err) => {
          this.saving = false;
          this.notification.error('Something went wrong...', err.message);
        },
        complete: () => {
          this.saving = false;
          console.log('completed');
        },
      })
    );
  }

  onCancel() {
    this.feedbackForm.reset();
    return false;
  }
}
