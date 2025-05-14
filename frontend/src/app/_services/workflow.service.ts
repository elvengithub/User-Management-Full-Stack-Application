import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AccountService } from './account.service';

@Injectable({ providedIn: 'root' })
export class WorkflowService {
    private baseUrl = `${environment.apiUrl}/workflows`;

    constructor(
        private http: HttpClient,
        private accountService: AccountService
    ) { }

    getAll(): Observable<any[]> {
        return this.http.get<any[]>(this.baseUrl)
            .pipe(catchError(error => this.handleError(error)));
    }

    getById(id: string): Observable<any> {
        return this.http.get<any>(`${this.baseUrl}/${id}`)
            .pipe(catchError(error => this.handleError(error)));
    }

    getByEmployee(employeeId: string): Observable<any[]> {
        return this.http.get<any[]>(`${this.baseUrl}/employee/${employeeId}`)
            .pipe(catchError(error => this.handleError(error)));
    }

    create(workflow: any): Observable<any> {
        return this.http.post<any>(this.baseUrl, workflow)
            .pipe(catchError(error => this.handleError(error)));
    }

    updateStatus(id: string, status: string): Observable<any> {
        return this.http.put<any>(`${this.baseUrl}/${id}/status`, { status })
            .pipe(catchError(error => this.handleError(error)));
    }

    private handleError(error: HttpErrorResponse) {
        // Handle authentication errors
        if (error.status === 401) {
            console.log('Authentication error in workflow service, handling locally');
            // We will not try to logout here as it's causing issues
        }
        return throwError(() => error);
    }
} 