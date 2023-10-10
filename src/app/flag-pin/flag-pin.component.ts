import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, TitleStrategy } from '@angular/router';
import type { JSONData } from '@xata.io/client';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import {
  NzNotificationModule,
  NzNotificationService,
} from 'ng-zorro-antd/notification';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { Observable, Subject, Subscription, of } from 'rxjs';
import type { PointsRecord } from 'xata';
import { ActivityService, EActivity } from '../activity.service';
import { PaddedPageContentComponent } from '../padded-page-content/padded-page-content.component';
import { PointsService } from '../points.service';
import { TemplatePageTitleStrategy } from '../title.strategy';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzFormModule,
    NzDividerModule,
    NzSpaceModule,
    NzAlertModule,
    NzInputModule,
    NzButtonModule,
    NzRadioModule,
    NzModalModule,
    NzNotificationModule,
    PaddedPageContentComponent,
  ],
  selector: 'app-flag-pin',
  templateUrl: './flag-pin.component.html',
  styleUrls: ['./flag-pin.component.scss'],
})
export class FlagPinComponent implements OnInit, OnDestroy {
  saving = false;
  pin?: Partial<JSONData<PointsRecord>>;
  subs: Subscription[] = [];
  id: string;

  flagPinForm = this.fb.group({
    issue: [null, Validators.required],
    description: [
      '',
      Validators.compose([Validators.required, Validators.minLength(100)]),
    ],
  });

  private titleStrategy = inject(TitleStrategy) as TemplatePageTitleStrategy;
  isFullPage: boolean;

  constructor(
    private pts: PointsService,
    private notification: NzNotificationService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private modal: NzModalService,
    private activity: ActivityService
  ) {
    this.id = activatedRoute.snapshot.params['id']!;
    this.isFullPage = activatedRoute.snapshot.data['fullPage'];
    this.flagPinForm.disable();
  }

  private leave?: () => void;
  ngOnInit(): void {
    this.subs.push(
      this.pts.getPointDescription(this.id).subscribe((pin) => {
        this.pin = pin;
        this.titleStrategy.entityTitle(pin.title as string);
        this.flagPinForm.enable();
      })
    );
    this.leave = this.activity.startActivity(EActivity.FlagPin);

    this.subs.push(
      this.activatedRoute.data.subscribe(({ fullPage }) => {
        this.isFullPage = fullPage;
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe);
    this.titleStrategy.clearEntityTitle();
    this.leave && this.leave();
  }

  private submitSubscription?: Subscription;
  onSubmit() {
    if (!this.flagPinForm.valid) {
      return;
    }
    this.saving = true;
    this.submitSubscription = this.pts
      .flagPoint(this.id, this.flagPinForm.value)
      .subscribe({
        next: () => {
          this.saving = false;
          this.notification.warning(
            'Pin 📍 flagged',
            `Pin 📍 "${this.pin!.title}" flagged.`
          );
          this.flagPinForm.markAsPristine();
          this.router.navigate(['/map'], {
            replaceUrl: true,
          });
        },
        error: (err) => {
          this.saving = false;
          this.notification.error('Something went wrong...', err.message);
        },
        complete: () => {
          this.saving = false;
          console.log('completed');
        },
      });
  }
  onCancel() {
    this.flagPinForm.reset();
    if (this.submitSubscription) {
      this.submitSubscription.unsubscribe();
      this.submitSubscription = undefined;
      this.saving = true;
    } else {
      this.router.navigate(['..']);
    }

    return false;
  }
  confirmDeactivate(): Observable<boolean> {
    if (!this.flagPinForm.dirty) {
      return of(true);
    } else {
      const leave$ = new Subject<boolean>();
      this.modal.confirm({
        nzTitle: 'There are unsaved changes.',
        nzContent: 'Leave and cancel all unsaved changes?',
        nzOkDanger: true,
        nzOnOk: () => leave$.next(true),
        nzOnCancel: () => leave$.next(false),
      });

      return leave$.asObservable();
    }
  }
}

export const canDeactivateFlagPin = (component: FlagPinComponent) =>
  component.confirmDeactivate();
