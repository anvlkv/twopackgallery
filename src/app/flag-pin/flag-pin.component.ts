import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, TitleStrategy } from '@angular/router';
import { JSONData } from '@xata.io/client';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { Observable, Subject, Subscription, of } from 'rxjs';
import { PointsRecord } from 'xata';
import { ActivityService, EActivity } from '../activity.service';
import { PointsService } from '../points.service';
import { TemplatePageTitleStrategy } from '../title.strategy';

@Component({
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
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe);
    this.titleStrategy.clearEntityTitle();
    this.leave && this.leave();
  }

  private submitSubscription?: Subscription;
  onSubmit() {
    if (!this.flagPinForm.valid) {
      return
    }
    
    this.submitSubscription = this.pts
      .flagPoint(this.id, this.flagPinForm.value)
      .subscribe({
        next: () => {
          this.saving = false;
          this.notification.warning(
            'Location flagged',
            `Location "${this.pin!.title}" flagged successfully.`
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
