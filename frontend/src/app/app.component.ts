import { Component, OnInit } from '@angular/core';
import { AccountService } from './_services';
import { Account, Role } from './_models';
import { environment } from '../environments/environment';

@Component({
  selector: 'app',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.css']
})
export class AppComponent implements OnInit {
  Role = Role;
  account: Account | null;
  apiEndpoint = environment.apiUrl;
  detectedEnv = environment.detectedEnvironment;
  isProduction = environment.production;

  constructor(private accountService: AccountService) {
    this.accountService.account.subscribe(x => {
      this.account = x;
      // Log account info for debugging
      if (this.account) {
        console.log('Current user:', {
          id: this.account.id,
          email: this.account.email,
          name: `${this.account.firstName} ${this.account.lastName}`,
          role: this.account.role
        });
        
        // Validate if role is correct enum value
        console.log('Role check:');
        console.log('- Raw role value:', this.account.role);
        console.log('- Is Admin?', this.account.role === Role.Admin);
        console.log('- Role enum Admin value:', Role.Admin);
      }
    });
  }

  ngOnInit() {
    // Verify authentication on app startup/refresh
    this.accountService.verifyAuth();
    
    // Log API endpoint for debugging
    if (!environment.production) {
      console.log(`Environment: ${environment.detectedEnvironment}`);
      console.log(`API Endpoint: ${environment.apiUrl}`);
    }
  }

  logout() {
    this.accountService.logout();
  }
}