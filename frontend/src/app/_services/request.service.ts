import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class RequestService {
    private baseUrl = `${environment.apiUrl}/requests`;

    constructor(private http: HttpClient) { }

    getAll(): Observable<any[]> {
        return this.http.get<any[]>(this.baseUrl);
    }

    getById(id: string): Observable<any> {
        return this.http.get<any>(`${this.baseUrl}/${id}`);
    }

    getByEmployee(employeeId: string): Observable<any[]> {
        return this.http.get<any[]>(`${this.baseUrl}/employee/${employeeId}`);
    }

    create(request: any): Observable<any> {
        return this.http.post<any>(this.baseUrl, request);
    }

    update(id: string, request: any): Observable<any> {
        return this.http.put<any>(`${this.baseUrl}/${id}`, request);
    }

    updateStatus(id: string, status: string): Observable<any> {
        return this.http.put<any>(`${this.baseUrl}/${id}/status`, { status });
    }

    delete(id: string): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/${id}`);
    }
} 