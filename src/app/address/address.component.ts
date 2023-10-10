import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, forwardRef } from '@angular/core';
import {
  AbstractControlOptions,
  ControlValueAccessor,
  FormBuilder,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import countries from 'i18n-iso-countries';
import countryCodes from 'i18n-iso-countries/langs/en.json';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzPopoverModule } from 'ng-zorro-antd/popover';
import { NzSelectModule, NzSelectOptionInterface } from 'ng-zorro-antd/select';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { Subscription, noop } from 'rxjs';
import { Address, LocationService } from '../location.service';
import { ViewAddressComponent } from '../view-address/view-address.component';

countries.registerLocale(countryCodes);

@Component({
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzPopoverModule,
    NzFormModule,
    NzButtonModule,
    NzIconModule,
    NzAlertModule,
    NzToolTipModule,
    NzInputModule,
    NzSelectModule,
    ViewAddressComponent,
  ],
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
  subs: Subscription[] = [];
  formVisible = false;
  disabled = false;
  countryOptions: NzSelectOptionInterface[] = Object.entries(
    countries.getAlpha2Codes()
  ).map(([k, v]) => ({
    value: k,
    label: countries.getName(v, 'en')!,
  }));

  addressForm = this.fb.group(
    {
      address_1: ['', Validators.required],
      address_2: [''],
      place: ['', Validators.required],
      region: [''],
      country: ['', Validators.required],
      code: ['', Validators.required],
      postcode: [''],
    },
    {
      asyncValidators: this.location.validateAddress.bind(this.location),
    } as AbstractControlOptions
  );

  constructor(private location: LocationService, private fb: FormBuilder) {}

  writeValue(obj: Address | null): void {
    if (obj) {
      this.addressForm.reset({
        address_1: obj.address_1 || '',
        address_2: obj.address_2 || '',
        place: obj.place || '',
        region: obj.region || '',
        country: obj.country || (obj.code && countries.getName(obj.code, 'en')),
        code:
          obj.code ||
          (obj.country && countries.getAlpha2Code(obj.country, 'en')),
        postcode: obj.postcode || '',
      });
      this.geoAddress = obj;
      this.isVagueGeoAddress = !this.geoAddress.address_1;
    } else {
      this.addressForm.reset();
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

    this.subs.push(
      this.addressForm.controls['code'].valueChanges.subscribe((code) => {
        if (code) {
          const country = countries.getName(code, 'en');
          this.addressForm.controls['country'].setValue(country || null);
        } else {
          this.addressForm.controls['country'].setValue(null);
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
        address_1: this.geoAddress.address_1 || '',
        address_2: this.geoAddress.address_2 || '',
        place: this.geoAddress.place || '',
        region: this.geoAddress.region || '',
        country:
          (this.geoAddress.code &&
            countries.getName(this.geoAddress.code, 'en')) ||
          '',
        code: this.geoAddress.code || '',
        postcode: this.geoAddress.postcode || '',
      });
    } else {
      this.addressForm.reset();
    }
  }

  onSubmit() {
    this.geoAddress = {
      address_1: this.addressForm.value.address_1 || undefined,
      address_2: this.addressForm.value.address_2 || undefined,
      place: this.addressForm.value.place || undefined,
      region: this.addressForm.value.region || undefined,
      country: this.addressForm.value.country || undefined,
      code: this.addressForm.value.code || undefined,
      postcode: this.addressForm.value.postcode || undefined,
    };
    this.isVagueGeoAddress = !this.geoAddress.address_1;
    this.formVisible = false;

    this._onChange(this.geoAddress);
  }

  onSubmitVague(ev: MouseEvent) {
    ev.preventDefault();

    this.geoAddress = {
      address_1: this.addressForm.value.address_1 || undefined,
      address_2: this.addressForm.value.address_2 || undefined,
      place: this.addressForm.value.place || undefined,
      region: this.addressForm.value.region || undefined,
      country: this.addressForm.value.country || undefined,
      code: this.addressForm.value.code || undefined,
      postcode: this.addressForm.value.postcode || undefined,
    };
    this.isVagueGeoAddress = true;
    this.formVisible = false;

    this._onChange(this.geoAddress);
  }
}
