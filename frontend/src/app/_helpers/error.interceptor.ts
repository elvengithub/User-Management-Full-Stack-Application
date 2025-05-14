import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { AccountService } from '../_services';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
    constructor(private accountService: AccountService) {}

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        return next.handle(request).pipe(catchError(err => {
            // Log all HTTP errors for debugging
            console.error('HTTP Error Intercepted:', {
                url: request.url,
                method: request.method,
                statusCode: err.status,
                message: err.message,
                error: err.error
            });

            // Handle specific status codes
            if (err instanceof HttpErrorResponse) {
                // Network error (no connection to server)
                if (err.status === 0) {
                    return throwError(() => new Error('Network error - Cannot connect to the server. Please check your internet connection.'));
                }
                
                // Unauthorized or Forbidden errors (handled by JWT interceptor)
                if ([401, 403].includes(err.status)) {
                    // Let JWT interceptor handle token refresh
                    return throwError(() => err);
                }
                
                // Handle CORS errors which might appear with various error messages
                if (err.error instanceof ProgressEvent && err.message.includes('Unknown Error')) {
                    return throwError(() => new Error('Cross-origin request blocked: Check network settings.'));
                }
                
                // Handle API errors with messages
                if (err.error?.message) {
                    return throwError(() => new Error(err.error.message));
                }
            }

            // For other errors, return the error message or a generic one
            const error = err.error?.message || err.statusText || 'Unknown error';
            return throwError(() => new Error(error));
        }));
    }
}
