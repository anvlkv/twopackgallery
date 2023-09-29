import { Component, OnDestroy, OnInit, forwardRef } from '@angular/core';
import { Subscription, noop } from 'rxjs';
import { Address, LocationService } from '../location.service';
import {
  AbstractControlOptions,
  ControlValueAccessor,
  FormBuilder,
  NG_VALUE_ACCESSOR,
  Validators,
} from '@angular/forms';

@Component({
  selector: 'app-address',
  templateUrl: './address.component.html',
  styleUrls: ['./address.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AddressComponent),
      multi: true,
    },
  ],
})
export class AddressComponent
  implements OnInit, OnDestroy, ControlValueAccessor
{
  geoAddress?: Address;
  isVagueGeoAddress = true;
  viewAddress?: string;
  subs: Subscription[] = [];
  formVisible = false;
  disabled = false;

  addressForm = this.fb.group(
    {
      address_1: ['', Validators.required],
      address_2: [''],
      poi: [''],
      place: ['', Validators.required],
      region: [''],
      country: ['', Validators.required],
      postcode: ['', Validators.required],
    },
    {
      asyncValidators: this.location.validateAddress.bind(this.location),
    } as AbstractControlOptions
  );

  constructor(private location: LocationService, private fb: FormBuilder) {}

  writeValue(obj: Address | null): void {
    if (obj) {
      this.addressForm.reset({
        poi: obj.poi || '',
        address_1: obj.address_1 || '',
        address_2: obj.address_2 || '',
        place: obj.place || '',
        region: obj.region || '',
        country: obj.country || '',
        postcode: obj.postcode || '',
      });
      this.geoAddress = obj;
      this.isVagueGeoAddress = !this.geoAddress.address_1;
      this.setViewAddress();
    }
    else {
      this.addressForm.reset();
      this.setViewAddress();
    }
  }

  private _onChange: (address: Address) => void = noop;
  registerOnChange(fn: (address: Address) => void): void {
    this._onChange = fn;
  }

  private _onTouched: () => void = noop;
  registerOnTouched(fn: any): void {
    this._onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    this.disabled = isDisabled;
    if (this.formVisible && isDisabled) {
      this.formVisible = false;
    }
  }

  ngOnInit(): void {
    this.subs.push(
      this.addressForm.valueChanges.subscribe(() => {
        if (this.addressForm.touched) {
          this._onTouched();
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
  }

  togglePopover(open: boolean) {
    if (!open) {
      this.resetFormToGeo();
    }
  }

  resetFormToGeo() {
    if (this.geoAddress) {
      this.addressForm.reset({
        poi: this.geoAddress.poi || '',
        address_1: this.geoAddress.address_1 || '',
        address_2: this.geoAddress.address_2 || '',
        place: this.geoAddress.place || '',
        region: this.geoAddress.region || '',
        country: this.geoAddress.country || '',
        postcode: this.geoAddress.postcode || '',
      });
    } else {
      this.addressForm.reset();
    }
  }

  setViewAddress() {
    const address = this.geoAddress!;
    this.viewAddress = [
      address.poi,
      address.address_1,
      address.address_2,
      address.place,
      address.region,
      address.country,
      address.postcode,
    ]
      .filter(Boolean)
      .join(', ');
  }

  onSubmit() {
    this.geoAddress = {
      address_1: this.addressForm.value.address_1 || undefined,
      address_2: this.addressForm.value.address_2 || undefined,
      poi: this.addressForm.value.poi || undefined,
      place: this.addressForm.value.place || undefined,
      region: this.addressForm.value.region || undefined,
      country: this.addressForm.value.country || undefined,
      postcode: this.addressForm.value.postcode || undefined,
    };
    this.isVagueGeoAddress = !this.geoAddress.address_1;
    this.formVisible = false;
    this.setViewAddress();

    this._onChange(this.geoAddress);
  }

  onSubmitVague(ev: MouseEvent) {
    ev.preventDefault();

    this.geoAddress = {
      address_1: this.addressForm.value.address_1 || undefined,
      address_2: this.addressForm.value.address_2 || undefined,
      poi: this.addressForm.value.poi || undefined,
      place: this.addressForm.value.place || undefined,
      region: this.addressForm.value.region || undefined,
      country: this.addressForm.value.country || undefined,
      postcode: this.addressForm.value.postcode || undefined,
    };
    this.isVagueGeoAddress = true;
    this.formVisible = false;
    this.setViewAddress();

    this._onChange(this.geoAddress);
  }
}
