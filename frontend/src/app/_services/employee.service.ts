import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class EmployeeService {
    private baseUrl = `${environment.apiUrl}/employees`;

    constructor(private http: HttpClient) { }

    getAll(): Observable<any[]> {
        return this.http.get<any[]>(this.baseUrl);
    }

    getById(id: string): Observable<any> {
        return this.http.get<any>(`${this.baseUrl}/${id}`);
    }

    create(employee: any): Observable<any> {
        return this.http.post<any>(this.baseUrl, employee);
    }

    update(id: string, employee: any): Observable<any> {
        return this.http.put<any>(`${this.baseUrl}/${id}`, employee);
    }

    delete(id: string): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/${id}`);
    }

    transfer(id: string, departmentId: string): Observable<any> {
        return this.http.put<any>(`${this.baseUrl}/${id}/transfer`, { departmentId });
    }
} 