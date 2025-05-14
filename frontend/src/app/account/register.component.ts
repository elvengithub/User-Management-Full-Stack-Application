import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';

import { AccountService, AlertService } from '../../app/_services';
import { MustMatch } from '../../app/_helpers';
import { environment } from '../../environments/environment';

@Component({ templateUrl: 'register.component.html' })
export class RegisterComponent implements OnInit {
    form: UntypedFormGroup;
    loading = false;
    submitted = false;
    apiInfo = { 
        url: environment.apiUrl,
        environment: environment.detectedEnvironment,
        isConnected: false,
        message: 'Checking API connection...'
    };
    testingConnection = true;

    constructor(
        private formBuilder: UntypedFormBuilder,
        private route: ActivatedRoute,
        private router: Router,
        private accountService: AccountService,
        private alertService: AlertService
    ) { }

    ngOnInit() {
        this.form = this.formBuilder.group({
            title: ['', Validators.required],
            firstName: ['', Validators.required],
            lastName: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(6)]],
            confirmPassword: ['', Validators.required],
            acceptTerms: [false, Validators.requiredTrue]
        }, {
            validator: MustMatch('password', 'confirmPassword')
        });

        // Test API connection on component initialization
        this.testApiConnection();
    }

    // Test connection to the API
    testApiConnection() {
        this.testingConnection = true;
        this.apiInfo.message = 'Checking API connection...';

        // If using fake backend, skip real API connection test
        if (environment.useFakeBackend) {
            this.apiInfo.isConnected = true;
            this.apiInfo.message = 'Using fake backend (no API connection needed)';
            this.testingConnection = false;
            return;
        }

        // Call the public test endpoint we just created
        fetch(`${environment.apiUrl}/public-test`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`API returned ${response.status}: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            this.apiInfo.isConnected = true;
            this.apiInfo.message = 'Connection successful';
            console.log('API connection test:', data);
        })
        .catch(error => {
            this.apiInfo.isConnected = false;
            this.apiInfo.message = `Connection failed: ${error.message}`;
            console.error('API connection test failed:', error);
        })
        .finally(() => {
            this.testingConnection = false;
        });
    }

    // convenience getter for easy access to form fields
    get f() { return this.form.controls; }

    onSubmit() {
        this.submitted = true;

        // reset alerts on submit
        this.alertService.clear();

        // stop here if form is invalid
        if (this.form.invalid) {
            return;
        }

        // Don't proceed if API is not connected
        if (!this.apiInfo.isConnected) {
            this.alertService.error('Cannot register: The API is not accessible. Please try again later.');
            return;
        }

        this.loading = true;
        this.accountService.register(this.form.value)
            .pipe(first())
            .subscribe({
                next: (response: any) => {
                    this.alertService.success(response.message || 'Registration successful', { keepAfterRouteChange: true });
                    this.router.navigate(['../login'], { relativeTo: this.route });
                },
                error: error => {
                    // Extract meaningful error message
                    let errorMessage = typeof error === 'string' ? error : 'Registration failed';
                    
                    // Check if it's an email-related error and highlight the email field
                    if (errorMessage.toLowerCase().includes('email') && 
                        errorMessage.toLowerCase().includes('already registered')) {
                        this.form.get('email')?.setErrors({ alreadyRegistered: true });
                        // Don't show alert for email errors, as we're displaying inline
                    } else {
                        // Only show alert for non-email related errors
                        this.alertService.error(errorMessage);
                    }
                    
                    this.loading = false;
                }
            });
    }
}
