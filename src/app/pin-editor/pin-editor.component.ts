import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  inject,
} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  ActivatedRoute,
  Router,
  RouterModule,
  TitleStrategy,
} from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import {
  NzNotificationModule,
  NzNotificationService,
} from 'ng-zorro-antd/notification';
import { NzSelectModule, NzSelectOptionInterface } from 'ng-zorro-antd/select';
import {
  Observable,
  Subject,
  Subscription,
  combineLatest,
  filter,
  map,
  of,
  skip,
  switchMap,
  take,
} from 'rxjs';
import { ActivityService, EActivity } from '../activity.service';
import { AddressComponent } from '../address/address.component';
import { ArtFormsService } from '../art-forms.service';
import {
  Cover,
  CoverEditorComponent,
} from '../cover-editor/cover-editor.component';
import { COVER_RATIO } from '../cover-image/consts';
import { Address, LocationService } from '../location.service';
import { PointsService } from '../points.service';
import { TemplatePageTitleStrategy } from '../title.strategy';
import { EPointStatus } from 'api/utils/point_status';
import { UserService } from '../user.service';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { MiniMapComponent } from '../mini-map/mini-map.component';
import { PaddedPageContentComponent } from '../padded-page-content/padded-page-content.component';
import { UserTagComponent } from '../user-tag/user-tag.component';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    NzDividerModule,
    NzFormModule,
    NzInputModule,
    NzSelectModule,
    NzButtonModule,
    NzDropDownModule,
    NzIconModule,
    NzModalModule,
    NzNotificationModule,
    NzSwitchModule,
    NzAlertModule,
    CoverEditorComponent,
    AddressComponent,
    MiniMapComponent,
    PaddedPageContentComponent,
    UserTagComponent,
  ],
  selector: 'app-pin-editor',
  templateUrl: './pin-editor.component.html',
  styleUrls: ['./pin-editor.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PinEditorComponent implements OnInit, OnDestroy {
  title: string;
  id?: string;
  hasDefinedAddress = false;
  saving = false;
  subs: Subscription[] = [];
  artFormsList: NzSelectOptionInterface[] = [];
  loadingArtForms = true;
  pinForm = this.fb.group({
    address: [{} as Address],
    longitude: [0, Validators.required],
    latitude: [0, Validators.required],
    cover: ['' as Cover, Validators.required],
    tile: ['' as Cover],
    title: [
      '',
      Validators.required,
      (c: AbstractControl<string>) => this.points.nameValidator(c, this.id),
    ],
    art_forms: [
      [] as string[],
      Validators.compose([
        (c: AbstractControl<string[]>) => {
          if (c.value && c.value.length < 1) {
            return { minLength: true };
          }
          return null;
        },
        (c: AbstractControl<string[]>) => {
          if (c.value && c.value.length > 5) {
            return { maxLength: true };
          }
          return null;
        },
      ]),
    ],
    description: [''],
    location_description: [''],
    published: [false],
    anonymous: [false],
    visitors: [true],
  });
  coverRatio = COVER_RATIO;
  isFullPage: boolean;
  minMapLocation = [0, 0] as [number, number];

  private titleStrategy = inject(TitleStrategy) as TemplatePageTitleStrategy;

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private artForms: ArtFormsService,
    private points: PointsService,
    private notification: NzNotificationService,
    private modal: NzModalService,
    private ch: ChangeDetectorRef,
    public fb: FormBuilder,
    public location: LocationService,
    public activity: ActivityService,
    public user: UserService
  ) {
    this.id = activatedRoute.snapshot.params['id'];
    this.title = this.id ? 'Edit pin' : 'New pin';
    this.isFullPage = Boolean(this.activatedRoute.snapshot.data['fullPage']);

    if (this.id) {
      this.pinForm.disable();
    }
  }

  leave?: () => void;

  ngOnInit(): void {
    this.artForms.queryArtForms();
    this.subs.push(
      this.activatedRoute.queryParams
        .pipe(take(1))
        .subscribe(({ lng, lat }) => {
          if (lng && lat) {
            this.pinForm.controls['longitude'].setValue(parseFloat(lng));
            this.pinForm.controls['latitude'].setValue(parseFloat(lat));
          }
        })
    );
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

    this.subs.push(
      this.user.verified.subscribe((v) => {
        this.pinForm.controls['published'].reset(v);
        if (!v) {
          this.pinForm.controls['published'].disable();
        } else {
          this.pinForm.controls['published'].enable();
        }
      })
    );

    if (this.id) {
      this.subs.push(
        this.points.getPointDescription(this.id).subscribe((point) => {
          this.hasDefinedAddress = Boolean(point.address);
          this.pinForm.reset({
            address: point.address as Address,
            cover: point.cover?.signedUrl,
            tile: point.tile?.signedUrl,
            title: point.title as string,
            description: point.description as string,
            location_description: point.location_description as string,
            art_forms: point.art_forms.map((r) => r.id) as any, //as string[]
            longitude: point.longitude as number,
            latitude: point.latitude as number,
            published: point.status === EPointStatus.Published,
            visitors: point.visitors,
            anonymous: point.anonymous,
          });
          this.titleStrategy.entityTitle(point.title as string);
          this.location.adjust_location([
            point.longitude as number,
            point.latitude as number,
          ]);
          this.pinForm.enable();

          if (!this.user.verified.getValue()) {
            this.pinForm.controls['published'].disable();
          } else {
            this.pinForm.controls['published'].enable();
          }
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
      this.leave = this.activity.startActivity(EActivity.CreatePin);
      if (this.location.getCurrentLocation()) {
        const [lng, lat] = this.location.getCurrentLocation();
        this.pinForm.controls['longitude'].reset(lng);
        this.pinForm.controls['latitude'].reset(lat);
      }
    }

    this.subs.push(
      this.location.currentLocation.subscribe(([longitude, latitude]) => {
        const [cLng, cLat] = [
          this.pinForm.value.longitude,
          this.pinForm.value.latitude,
        ];
        this.pinForm.controls['longitude'].setValue(longitude);
        if (cLng !== longitude) {
          this.pinForm.controls['longitude'].markAsDirty();
        }
        this.pinForm.controls['latitude'].setValue(latitude);
        if (cLat !== latitude) {
          this.pinForm.controls['latitude'].markAsDirty();
        }
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
          if (collection.features[0]) {
            const [longitude, latitude] = (
              collection.features[0].geometry as GeoJSON.Point
            ).coordinates;
            this.location.adjust_location([longitude, latitude]);
            this.pinForm.controls['longitude'].setValue(longitude);
            this.pinForm.controls['longitude'].markAsDirty();
            this.pinForm.controls['latitude'].setValue(latitude);
            this.pinForm.controls['latitude'].markAsDirty();
          }
        })
    );

    this.subs.push(
      this.activatedRoute.data.subscribe(
        ({ fullPage }) => (this.isFullPage = fullPage)
      )
    );

    this.subs.push(
      this.pinForm.valueChanges.subscribe(({ longitude, latitude }) => {
        this.minMapLocation = [longitude || 0, latitude || 0];
      })
    );

    this.subs.push(
      combineLatest({
        value: this.pinForm.valueChanges,
        status: this.pinForm.statusChanges,
      }).subscribe(() => {
        this.ch.detectChanges();
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
    this.titleStrategy.clearEntityTitle();
    this.leave && this.leave();
  }

  submitSubscription?: Subscription;
  onSubmit() {
    if (!this.pinForm.valid) {
      return;
    }
    this.saving = true;
    const { cover, tile, address, published, ...formValue } =
      this.pinForm.value;
    const coverFile = typeof cover === 'object' ? cover : undefined;
    const tileFile = typeof tile === 'object' ? tile : undefined;

    (formValue as any).status = published
      ? EPointStatus.Published
      : EPointStatus.Draft;

    if (!this.id) {
      const value = this.pinForm.controls['address'].dirty
        ? {
            ...formValue,
            address,
          }
        : formValue;
      this.submitSubscription = this.points
        .createNewPoint(value as any, coverFile, tileFile)
        .subscribe({
          next: ({ point, ownership }) => {
            this.saving = false;
            this.notification.success(
              "You've just added a new pin!",
              `Pin 📍 "${point!.title}" added.`
            );
            this.router.navigate(['pin', point!.id], {
              replaceUrl: true,
              relativeTo: this.activatedRoute.parent,
              queryParams: null,
            });
            this.pinForm.markAsPristine();
            this.user.onAddOwnership({ ...ownership!, point });
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
      const value =
        this.pinForm.controls['address'].dirty || this.hasDefinedAddress
          ? {
              ...formValue,
              address,
            }
          : formValue;
      this.submitSubscription = this.points
        .updatePoint(this.id, value as any, coverFile, tileFile)
        .subscribe({
          next: (updatedPoint) => {
            this.saving = false;
            this.notification.success(
              'Changes saved.',
              `Pin 📍 "${updatedPoint.title}" updated.`
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
            'Pin 📍 deleted',
            `Pin 📍 "${deletedPoint.title}" deleted.`
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
      this.router.navigate(['../'], { relativeTo: this.activatedRoute });
    }

    return false;
  }

  onMiniMapLocationChange(ev: [number, number]) {
    this.location.adjust_location(ev);
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
