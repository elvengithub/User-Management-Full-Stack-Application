import { Component, OnInit } from '@angular/core';
import { AccountService } from '../_services';
import { first } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Role } from '../_models';

@Component({ templateUrl: 'home.component.html' })
export class HomeComponent implements OnInit {
    account: any;
    apiEnvironment = environment.detectedEnvironment;
    apiEndpoint = environment.apiUrl;
    isProduction = environment.production;
    connectionInfo: any = null;
    connectionTesting = false;
    Role = Role;

    constructor(private accountService: AccountService) {}
    
    ngOnInit() {
        // Keep track of account changes
        this.accountService.account.subscribe(x => {
            this.account = x;
        });
        
        // Only test connection automatically for admin users
        if (!environment.production && this.account?.role === 'Admin') {
            this.testConnection();
        }
    }
    
    testConnection() {
        this.connectionTesting = true;
        // Use public-test endpoint that doesn't require authentication
        this.accountService.testConnection()
            .pipe(first())
            .subscribe({
                next: (info) => {
                    this.connectionInfo = {
                        status: 'success',
                        endpoint: this.apiEndpoint,
                        environment: this.apiEnvironment,
                        response: info
                    };
                    this.connectionTesting = false;
                    console.log('Connection info:', this.connectionInfo);
                },
                error: (error) => {
                    console.error('Connection test error:', error);
                    this.connectionTesting = false;
                    this.connectionInfo = {
                        status: 'error',
                        error: error.message || 'Failed to connect'
                    };
                }
            });
    }
}