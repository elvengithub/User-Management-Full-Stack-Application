import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { first } from 'rxjs/operators';

import { RequestService, AccountService } from '../../_services';

@Component({
  templateUrl: './list.component.html'
})
export class ListComponent implements OnInit {
  requests: any[] = [];
  loading = false;
  isAdmin = false;
  employeeId?: string;

  constructor(
    private requestService: RequestService,
    private accountService: AccountService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.loading = true;
    this.isAdmin = this.accountService.accountValue?.role === 'Admin';
    this.employeeId = this.route.snapshot.queryParams['employeeId'];
    
    if (this.employeeId) {
      this.requestService.getByEmployee(this.employeeId)
        .pipe(first())
        .subscribe(
          requests => {
            this.loading = false;
            this.requests = requests;
          },
          error => {
            console.error('Error loading requests:', error);
            this.loading = false;
          }
        );
    } else {
      this.requestService.getAll()
        .pipe(first())
        .subscribe(
          requests => {
            this.loading = false;
            this.requests = requests;
          },
          error => {
            console.error('Error loading requests:', error);
            this.loading = false;
          }
        );
    }
  }

  editRequest(id: string) {
    this.router.navigate(['/requests/edit', id]);
  }

  deleteRequest(id: string) {
    if (confirm('Are you sure you want to delete this request?')) {
      this.requestService.delete(id)
        .pipe(first())
        .subscribe(
          () => {
            this.requests = this.requests.filter(x => x.id !== id);
          },
          error => {
            console.error('Error deleting request:', error);
          }
        );
    }
  }
} 