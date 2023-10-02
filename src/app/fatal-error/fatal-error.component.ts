import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzResultModule } from 'ng-zorro-antd/result';
import { Subscription, map, take, timer } from 'rxjs';

const RETRY_IN = 5000;

@Component({
  standalone: true,
  imports: [
    NzResultModule,
    NzButtonModule,
  ],
  selector: 'app-fatal-error',
  templateUrl: './fatal-error.component.html',
  styleUrls: ['./fatal-error.component.scss'],
})
export class FatalErrorComponent implements OnInit, OnDestroy {
  error: string;
  sBeforeRetry: number = RETRY_IN / 1000;
  subs: Subscription[] = [];
  url: string;

  constructor(private activatedRoute: ActivatedRoute) {
    this.error = activatedRoute.snapshot.data['error'] || 'Unknown error';
    this.url = activatedRoute.snapshot.data['url'] || '/';
  }

  ngOnInit(): void {
    this.subs.push(
      this.activatedRoute.data.subscribe((d) => {
        this.error = d['error'] || 'Unknown error';
        this.url = d['url'] || '/';
      })
    );

    this.subs.push(
      timer(100, 100)
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
        })
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
  }

  retryNow() {
    window.location.assign(this.url);
  }
}
