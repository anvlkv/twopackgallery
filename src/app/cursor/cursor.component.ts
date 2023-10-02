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

@Component({
  standalone: true,
  imports: [
    CommonModule,
    NzSpinModule,
    NzIconModule,
    AvatarComponent,
    NzSpaceModule,
    NzToolTipModule,
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
    if (!this.storage.get('noHints')) {
      this._tooltip = val;
    }
  }
  get tooltip() {
    return this.loading ? undefined : this._tooltip;
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
}
