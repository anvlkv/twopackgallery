import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  AbstractControl,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzNotificationModule } from 'ng-zorro-antd/notification';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzStepsModule } from 'ng-zorro-antd/steps';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { EActivity } from '../activity.service';
import { AddressComponent } from '../address/address.component';
import { CoverEditorComponent } from '../cover-editor/cover-editor.component';
import { MiniMapComponent } from '../mini-map/mini-map.component';
import { PaddedPageContentComponent } from '../padded-page-content/padded-page-content.component';
import { PinEditorComponent } from '../pin-editor/pin-editor.component';
import { TileEditorComponent } from '../tile-editor/tile-editor.component';
import { UserTagComponent } from '../user-tag/user-tag.component';

@Component({
  selector: 'app-create-pin',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzModalModule,
    NzNotificationModule,
    NzStepsModule,
    NzAlertModule,
    NzFormModule,
    NzInputModule,
    NzSwitchModule,
    NzButtonModule,
    NzSelectModule,
    NzSpaceModule,
    NzDividerModule,
    MiniMapComponent,
    AddressComponent,
    CoverEditorComponent,
    TileEditorComponent,
    PaddedPageContentComponent,
    UserTagComponent,
  ],
  templateUrl: './create-pin.component.html',
  styleUrls: ['./create-pin.component.scss'],
})
export class CreatePinComponent extends PinEditorComponent implements OnInit {
  steps = ['location', 'title', 'cover', 'tile', 'publish'].map((id, i) => ({
    i,
    id,
  }));
  currentStep: (typeof this)['steps'][0] = { i: 0, id: 'location' };
  isStepValid = false;

  tagControl = this.fb.control('', {
    validators: [
      Validators.required,
      ({ value }: AbstractControl<string>) => {
        if (/[^a-z0-9]/.test(value || '')) {
          return { InvalidTag: true };
        } else {
          return null;
        }
      },
    ],
    asyncValidators: [this.user.validateTag],
  });

  override ngOnInit() {
    super.ngOnInit();

    this.subs.push(
      this.pinForm.valueChanges.subscribe(() => {
        this.isStepValid = this.checkStepValid(this.currentStep);
      })
    );

    this.subs.push(
      this.tagControl.statusChanges.subscribe(() => {
        this.isStepValid = this.checkStepValid(this.currentStep);
      })
    )

    this.subs.push(
      this.user.user.subscribe((u) =>
        this.tagControl.reset((u?.user?.['tag'] as string) || '')
      )
    );
  }

  checkStepValid(step: (typeof this)['steps'][0]): boolean {
    const stepsBefore = this.steps.slice(
      0,
      this.steps.findIndex(({ id }) => id === step.id)
    );
    switch (step.id) {
      case 'location': {
        return (
          [
            this.pinForm.controls['address'],
            this.pinForm.controls['longitude'],
            this.pinForm.controls['latitude'],
            this.pinForm.controls['visitors'],
            this.pinForm.controls['location_description'],
          ].every((c) => c.valid) &&
          stepsBefore.every((s) => this.checkStepValid(s))
        );
      }
      case 'title': {
        return (
          [
            this.pinForm.controls['title'],
            this.pinForm.controls['description'],
            this.pinForm.controls['art_forms'],
          ].every((c) => c.valid) &&
          stepsBefore.every((s) => this.checkStepValid(s))
        );
      }
      case 'cover': {
        return (
          [this.pinForm.controls['cover']].every((c) => c.valid) &&
          stepsBefore.every((s) => this.checkStepValid(s))
        );
      }
      case 'tile': {
        return (
          [this.pinForm.controls['tile']].every((c) => c.valid) &&
          stepsBefore.every((s) => this.checkStepValid(s))
        );
      }
      case 'publish': {
        return (
          this.pinForm.valid &&
          (this.pinForm.value.anonymous || this.tagControl.valid)
        );
      }
      default: {
        return false;
      }
    }
  }

  completeStep(ev: MouseEvent) {
    const current = this.currentStep.i;
    this.leaveStepCurrent();
    if (this.steps.length - 1 >= current + 1) {
      this.currentStep = this.steps[current + 1];
      this.isStepValid = this.checkStepValid(this.currentStep);
      this.enterStepCurrent();
    } else if (this.pinForm.valid) {
      if (!this.pinForm.value.anonymous && this.tagControl.dirty) {
        if (!this.tagControl.valid) {
          return;
        }
        this.saving = true;
        this.submitSubscription = this.user
          .updateUserData({ tag: this.tagControl.value as string })
          .subscribe(() => {
            this.onSubmit();
          });
      } else {
        this.onSubmit();
      }
    }
    return false;
  }

  popStep(e: MouseEvent) {
    const current = this.currentStep.i;
    this.leaveStepCurrent();
    if (current - 1 >= 0) {
      this.currentStep = this.steps[current - 1];
      this.isStepValid = this.checkStepValid(this.currentStep);
      this.enterStepCurrent();
    } else {
      this.onCancel(e);
    }
    return false;
  }

  enterStepCurrent() {
    switch (this.currentStep.id) {
      case 'location': {
        this.leave = this.activity.startActivity(EActivity.CreatePin);
        break;
      }
      default: {
      }
    }
  }
  leaveStepCurrent() {
    switch (this.currentStep.id) {
      case 'location': {
        this.leave = this.activity.startActivity(EActivity.CreatePinLocked);
        break;
      }
      default: {
      }
    }
  }

  handleTagInput(ev: Event) {
    const input = ev.target as HTMLInputElement;
    input.value = input.value.replace(/[^a-z0-9]/g, '');
    return ev;
  }
}

export const canDeactivateCreatePin = (component: CreatePinComponent) =>
  component.confirmDeactivate();
