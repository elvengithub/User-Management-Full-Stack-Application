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
        
        // For development purposes, automatically test connection on home page load
        if (!environment.production) {
            this.testConnection();
        }
    }
    
    testConnection() {
        this.connectionTesting = true;
        this.accountService.getConnectionInfo()
            .pipe(first())
            .subscribe({
                next: (info) => {
                    this.connectionInfo = info;
                    this.connectionTesting = false;
                    console.log('Connection info:', info);
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