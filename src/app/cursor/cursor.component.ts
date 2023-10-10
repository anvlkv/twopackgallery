import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { Subscription } from 'rxjs';
import { ActivityService, EActivity } from '../activity.service';
import { AvatarComponent } from '../avatar/avatar.component';
import { BrowserStorageService } from '../browser-storage.service';
import { NzButtonModule } from 'ng-zorro-antd/button';

export const NO_HINTS_KEY = 'noHints';
@Component({
  standalone: true,
  imports: [
    CommonModule,
    NzSpinModule,
    NzIconModule,
    AvatarComponent,
    NzSpaceModule,
    NzToolTipModule,
    NzButtonModule,
  ],
  selector: 'app-cursor',
  templateUrl: './cursor.component.html',
  styleUrls: ['./cursor.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CursorComponent implements OnInit, OnDestroy {
  @Input('loading')
  loading?: boolean | null;

  subs: Subscription[] = [];

  currentActivity?: EActivity;
  eActivity = EActivity;

  private _tooltip?: string;

  @Input('tooltip')
  set tooltip(val: string | undefined) {
    this._tooltip = val;
    this.ch.detectChanges();
  }
  get tooltip() {
    return this.loading ? undefined : this._tooltip;
  }

  get showHint() {
    return Boolean(
      this.tooltip && !this.storage.get(NO_HINTS_KEY) && !this.loading
    );
  }

  constructor(
    private activity: ActivityService,
    private ch: ChangeDetectorRef,
    private storage: BrowserStorageService
  ) {}

  ngOnInit(): void {
    this.subs.push(
      this.activity.activity.subscribe((activity) => {
        this.currentActivity = activity;
        this.ch.detectChanges();
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
  }

  stopHints() {
    this._tooltip = undefined;
    this.storage.set(NO_HINTS_KEY, true);
    this.ch.detectChanges();
    return false;
  }
  hideHint() {
    this._tooltip = undefined;
    this.ch.detectChanges();
    return false;
  }
}
