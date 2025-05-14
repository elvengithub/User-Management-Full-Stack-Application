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
    this.accountService.account.subscribe(x => this.account = x);
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