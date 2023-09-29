import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse,
  HttpClient,
} from '@angular/common/http';
import { Observable, catchError, tap } from 'rxjs';

const MAX_RETRY_ATTEMPTS = 5;

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  private retryMap = new Map<string, number>();

  constructor(private http: HttpClient) {}

  intercept(
    request: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(
      catchError((err: HttpErrorResponse) => {
        const key = request.method + request.urlWithParams;
        const attempts = this.retryMap.get(key) || 0;

        if (attempts >= MAX_RETRY_ATTEMPTS) {
          throw { message: err.statusText, code: err.status };
        } else {
          return this.http
            .request(request)
            .pipe(tap(() => this.retryMap.delete(key)));
        }
      })
    );
  }
}
