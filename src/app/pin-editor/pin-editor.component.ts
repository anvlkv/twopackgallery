import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, TitleStrategy } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzNotificationModule, NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSelectModule, NzSelectOptionInterface } from 'ng-zorro-antd/select';
import {
  Observable,
  Subject,
  Subscription,
  filter,
  map,
  of,
  skipWhile,
  switchMap
} from 'rxjs';
import { ActivityService, EActivity } from '../activity.service';
import { AddressComponent } from '../address/address.component';
import { ArtFormsService } from '../art-forms.service';
import { Cover, CoverEditorComponent } from '../cover-editor/cover-editor.component';
import { Address, LocationService } from '../location.service';
import { PointsService } from '../points.service';
import { TemplatePageTitleStrategy } from '../title.strategy';
import { COVER_RATIO } from '../cover-image/consts';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzDividerModule,
    NzFormModule,
    NzInputModule,
    NzSelectModule,
    NzButtonModule,
    NzDropDownModule,
    NzIconModule,
    NzModalModule,
    NzNotificationModule,
    CoverEditorComponent,
    AddressComponent,
  ],
  selector: 'app-pin-editor',
  templateUrl: './pin-editor.component.html',
  styleUrls: ['./pin-editor.component.scss'],
})
export class PinEditorComponent implements OnInit, OnDestroy {
  title: string;
  id?: string;
  saving = false;
  subs: Subscription[] = [];
  artFormsList: NzSelectOptionInterface[] = [];
  loadingArtForms = true;
  pinForm = this.fb.group({
    address: [{} as Address],
    longitude: [0, Validators.required],
    latitude: [0, Validators.required],
    cover: ['' as Cover, Validators.required],
    title: [
      '',
      Validators.required,
      (c: AbstractControl<string>) => this.points.nameValidator(c, this.id),
    ],
    art_forms: [
      [] as string[],
      Validators.compose([
        (c: AbstractControl<string[]>) => {
          if (c.value.length < 1) {
            return { minLength: true };
          }
          return null;
        },
        (c: AbstractControl<string[]>) => {
          if (c.value.length > 5) {
            return { maxLength: true };
          }
          return null;
        },
      ]),
    ],
    description: [''],
    location_description: [''],
  });
  coverRatio = COVER_RATIO;



  private titleStrategy = inject(TitleStrategy) as TemplatePageTitleStrategy;

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private location: LocationService,
    private artForms: ArtFormsService,
    private points: PointsService,
    private notification: NzNotificationService,
    private modal: NzModalService,
    private activity: ActivityService
  ) {
    this.id = activatedRoute.snapshot.params['id'];
    this.title = this.id ? 'Edit location' : 'New location';

    if (this.id) {
      this.pinForm.disable();
    }
  }
  private leave?: () => void;

  ngOnInit(): void {
    this.artForms.queryArtForms();

    this.subs.push(
      this.artForms.fetchedArtForms
        .pipe(
          map((d) =>
            d.map(
              ({ name, id }) =>
                ({
                  label: name,
                  value: id,
                } as NzSelectOptionInterface)
            )
          )
        )
        .subscribe((d) => {
          this.artFormsList = d;
          this.loadingArtForms = false;
        })
    );

    if (this.id) {
      this.subs.push(
        this.points.getPointDescription(this.id).subscribe((point) => {
          this.pinForm.reset({
            address: point.address as Address,
            cover: point.cover?.url,
            title: point.title as string,
            description: point.description as string,
            location_description: point.location_description as string,
            art_forms: point.art_forms as any, //as string[]
            longitude: point.longitude as number,
            latitude: point.latitude as number,
          });
          this.titleStrategy.entityTitle(point.title as string);
          this.location.adjust_location([
            point.longitude as number,
            point.latitude as number,
          ]);
          this.pinForm.enable();
        })
      );
      this.leave = this.activity.startActivity(EActivity.EditPin);
    } else {
      this.subs.push(
        this.location.currentLocation
          .pipe(
            filter(() => !this.pinForm.controls['address'].dirty),
            switchMap((coords) => this.location.reverseGeoCode(coords!))
          )
          .subscribe((located) => {
            this.pinForm.controls['address'].reset(located);
          })
      );
      this.leave = this.activity.startActivity(EActivity.PinNew);
    }

    this.subs.push(
      this.location.currentLocation
        .pipe(
          skipWhile(
            () =>
              this.pinForm.controls['address'].dirty ||
              Boolean(this.id && this.pinForm.disabled)
          )
        )
        .subscribe(([longitude, latitude]) => {
          this.pinForm.controls['longitude'].setValue(longitude);
          this.pinForm.controls['latitude'].setValue(latitude);
        })
    );

    this.subs.push(
      this.pinForm.controls['address'].valueChanges
        .pipe(
          filter((value) =>
            Boolean(
              value &&
                this.pinForm.controls['address'].valid &&
                this.pinForm.controls['address'].dirty
            )
          ),
          switchMap((address) => this.location.geoCodeAddress(address!))
        )
        .subscribe((collection) => {
          console.log(collection);
        })
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
    this.titleStrategy.clearEntityTitle();
    this.leave && this.leave();
  }

  private submitSubscription?: Subscription;
  onSubmit() {
    if (!this.pinForm.valid) {
      return
    }
    this.saving = true;
    const {cover, ...formValue} = this.pinForm.value;
    const coverFile = typeof cover === 'object' ? cover : undefined;

    if (!this.id) {
      this.submitSubscription = this.points
        .createNewPoint(formValue, coverFile)
        .subscribe({
          next: (newPoint) => {
            this.saving = false;
            this.notification.success(
              "You've just added a new location!",
              `Location "${newPoint.title}" added successfully.`
            );
            this.router.navigate(['map', 'pin', newPoint.id], {
              replaceUrl: true,
            });
            this.pinForm.markAsPristine();
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
    } else {
      this.submitSubscription = this.points
        .updatePoint(this.id, this.pinForm.value, coverFile)
        .subscribe({
          next: (updatedPoint) => {
            this.saving = false;
            this.notification.success(
              'Changes saved.',
              `Location "${updatedPoint.title}" updated successfully.`
            );
            this.pinForm.markAsPristine();
            this.router.navigate(['map', 'pin', updatedPoint.id], {
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
  }

  onDelete(e: MouseEvent) {
    const confirm$ = new Subject<boolean>();

    this.modal.confirm({
      nzTitle: `Delete location "${this.pinForm.value.title}"`,
      nzContent: 'This action is irreversible.',
      nzOkDanger: true,
      nzOnOk: () => confirm$.next(true),
      nzOnCancel: () => confirm$.next(false),
    });

    confirm$.pipe(filter(Boolean)).subscribe(() => {
      this.saving = true;
      this.submitSubscription = this.points.deletePoint(this.id!).subscribe({
        next: (deletedPoint) => {
          this.saving = false;
          this.notification.success(
            'Location deleted',
            `Location "${deletedPoint.title}" deleted successfully.`
          );
          this.pinForm.markAsPristine();
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
    });

    return false;
  }

  onCancel(e: MouseEvent) {
    this.pinForm.reset();
    if (this.submitSubscription) {
      this.submitSubscription.unsubscribe();
      this.submitSubscription = undefined;
    } else {
      this.router.navigate(['.'], { relativeTo: this.activatedRoute.parent });
    }

    return false;
  }

  confirmDeactivate(): Observable<boolean> {
    if (!this.pinForm.dirty) {
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

export const canDeactivatePinEditor = (component: PinEditorComponent) =>
  component.confirmDeactivate();
