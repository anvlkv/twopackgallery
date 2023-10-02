import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
} from '@angular/common/http';
import { Observable, retry } from 'rxjs';

const RETRY_COUNT = 5;
const RETRY_DELAY = 150;

@Injectable()
export class RetryInterceptor implements HttpInterceptor {
  constructor() {}

  intercept(
    request: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    if (request.headers.has('X-Retry')) {
      return next.handle(request);
    } else {
      request.headers.set('X-Retry', RETRY_COUNT.toString());

      return next
        .handle(request)
        .pipe(retry({ count: RETRY_COUNT, delay: RETRY_DELAY }));
    }
  }
}
