import { isPlatformBrowser, DOCUMENT } from '@angular/common';
import {
  Component,
  Inject,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzResultModule } from 'ng-zorro-antd/result';
import { Subscription, map, take, timer } from 'rxjs';

const RETRY_IN = 5000;

@Component({
  standalone: true,
  imports: [NzResultModule, NzButtonModule],
  selector: 'app-fatal-error',
  templateUrl: './fatal-error.component.html',
  styleUrls: ['./fatal-error.component.scss'],
})
export class FatalErrorComponent implements OnInit, OnDestroy {
  error: string;
  sBeforeRetry: number = RETRY_IN / 1000;
  subs: Subscription[] = [];
  url: string;

  constructor(
    private activatedRoute: ActivatedRoute,
    @Inject(DOCUMENT) public document: Document,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.error = activatedRoute.snapshot.data['error'] || 'Unknown error';
    this.url = activatedRoute.snapshot.data['url'] || '/';
  }

  retrySubscription?: Subscription;
  ngOnInit(): void {
    this.subs.push(
      this.activatedRoute.data.subscribe((d) => {
        this.error = d['error'] || 'Unknown error';
        this.url = d['url'] || '/';
      })
    );

    this.retrySubscription = timer(100, 100)
      .pipe(
        map((i) => RETRY_IN - i * 100),
        take(RETRY_IN / 100 + 1)
      )
      .subscribe((i) => {
        if (i <= 0) {
          this.retryNow();
        } else {
          this.sBeforeRetry = i / 100;
        }
      });
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
  }

  retryNow() {
    if (isPlatformBrowser(this.platformId)){
      this.document.location.assign(this.url);
    }
  }

  cancel() {
    this.retrySubscription?.unsubscribe();
  }
}
