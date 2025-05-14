import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CorsProxyService {
  // The Render backend API URL
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  /**
   * Makes a request through the proxy to avoid CORS issues
   * @param method The HTTP method (GET, POST, PUT, DELETE)
   * @param endpoint The API endpoint without the base URL
   * @param body The request body (for POST/PUT)
   * @returns An Observable with the API response
   */
  request(method: string, endpoint: string, body?: any): Observable<any> {
    const url = `${this.apiUrl}${endpoint}`;
    
    // Set common options for all requests
    const options = {
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true
    };

    console.log(`Making ${method} request to: ${url}`);
    
    switch (method.toUpperCase()) {
      case 'GET':
        return this.http.get(url, options);
      case 'POST':
        return this.http.post(url, body, options);
      case 'PUT':
        return this.http.put(url, body, options);
      case 'DELETE':
        return this.http.delete(url, options);
      default:
        throw new Error(`Unsupported method: ${method}`);
    }
  }
} 