import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { AbstractControl, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, TitleStrategy } from '@angular/router';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSelectOptionInterface } from 'ng-zorro-antd/select';
import { NzUploadFile } from 'ng-zorro-antd/upload';
import { ImageCroppedEvent } from 'ngx-image-cropper';
import {
  BehaviorSubject,
  Observable,
  Subject,
  Subscription,
  filter,
  from,
  map,
  of,
  skipWhile,
  switchMap,
} from 'rxjs';
import { ActivityService, EActivity } from '../activity.service';
import { ArtFormsService } from '../art-forms.service';
import { COVER_RATIO } from '../cover-image/cover-image.component';
import { Address, LocationService } from '../location.service';
import { PointsService } from '../points.service';
import { TemplatePageTitleStrategy } from '../title.strategy';
@Component({
  selector: 'app-pin-editor',
  templateUrl: './pin-editor.component.html',
  styleUrls: ['./pin-editor.component.scss'],
})
export class PinEditorComponent implements OnInit, OnDestroy {
  title: string;
  pictureUrl?: string;
  fb64 = new BehaviorSubject<{
    mediaType: string;
    base64Content: string;
  } | null>(null);
  saving = false;
  subs: Subscription[] = [];
  artFormsList: NzSelectOptionInterface[] = [];
  loadingArtForms = true;
  imageCropped = true;
  pinForm = this.fb.group({
    address: [{} as Address],
    longitude: [0, Validators.required],
    latitude: [0, Validators.required],
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

  coverFile: NzUploadFile[] = [];

  id?: string;

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

    this.subs.push(
      this.fb64.pipe(filter(Boolean)).subscribe((d) => {
        this.pictureUrl = `data:${d!.mediaType};base64,${d!.base64Content}`;
      })
    );

    if (this.id) {
      this.subs.push(
        this.points.getPointDescription(this.id).subscribe((point) => {
          this.pinForm.reset({
            address: point.address as Address,
            title: point.title as string,
            description: point.description as string,
            location_description: point.location_description as string,
            art_forms: point.art_forms as any, //as string[]
            longitude: point.longitude as number,
            latitude: point.latitude as number,
          });
          this.pictureUrl = point.cover?.url;
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
    this.saving = true;
    const coverFile = this.fb64.getValue() || undefined;

    if (!this.id) {
      this.submitSubscription = this.points
        .createNewPoint(this.pinForm.value, coverFile)
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

  cropperHint?: string;
  croppedImage?: Blob;
  onCropperReady() {
    this.cropperHint = 'You may adjust how the image is cropped and scaled.';
  }
  onImageLoadFailed() {
    this.notification.error(
      'Could not open the uploaded image.',
      'Please try again or choose a different file.'
    );
    this.clearImage();
  }
  onImageCropped(ev: ImageCroppedEvent) {
    this.croppedImage = ev.blob || undefined;
  }

  clearImage() {
    this.pictureUrl = undefined;
    this.fb64.next(null);
    this.coverFile = [];
    this.imageCropped = true;
    return false;
  }

  acceptCropped() {
    this.imageCropped = true;
    this.fb64FromArrayBuffer(this.croppedImage!, this.croppedImage!.type);
    return false;
  }

  private fb64FromArrayBuffer(data: File | Blob, mediaType: string) {
    from(data.arrayBuffer()).pipe(map(arrayBuffer => {
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
    })).subscribe(d => this.fb64.next(d))
  }

  beforeUploadCover = (file: NzUploadFile) => {
    this.coverFile = [file];
    this.imageCropped = false;
    const data = (file as unknown as File);
    this.fb64FromArrayBuffer(data, data.type);
    return false;
  };

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
