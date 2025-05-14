import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DepartmentService {
    private baseUrl = `${environment.apiUrl}/departments`;

    constructor(private http: HttpClient) { }

    getAll(): Observable<any[]> {
        return this.http.get<any[]>(this.baseUrl);
    }

    getById(id: string): Observable<any> {
        return this.http.get<any>(`${this.baseUrl}/${id}`);
    }

    create(department: any): Observable<any> {
        return this.http.post<any>(this.baseUrl, department);
    }

    update(id: string, department: any): Observable<any> {
        return this.http.put<any>(`${this.baseUrl}/${id}`, department);
    }

    delete(id: string): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/${id}`);
    }
} 