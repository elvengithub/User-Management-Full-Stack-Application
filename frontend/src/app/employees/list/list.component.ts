import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { first } from 'rxjs/operators';

import { EmployeeService, AccountService } from '../../_services';
import { Employee } from '../../_models';

@Component({
  templateUrl: './list.component.html'
})
export class ListComponent implements OnInit {
  employees: any[] = [];
  loading = false;
  isAdmin = false;

  constructor(
    private employeeService: EmployeeService,
    private accountService: AccountService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loading = true;
    this.isAdmin = this.accountService.accountValue?.role === 'Admin';
    
    this.employeeService.getAll()
      .pipe(first())
      .subscribe(
        employees => {
          this.loading = false;
          this.employees = employees;
        },
        error => {
          console.error('Error loading employees:', error);
          this.loading = false;
        }
      );
  }

  editEmployee(id: string) {
    this.router.navigate(['/employees/edit', id]);
  }

  viewRequests(id: string) {
    this.router.navigate(['/requests'], { queryParams: { employeeId: id } });
  }

  viewWorkflows(id: string) {
    this.router.navigate(['/workflows/employee', id]);
  }

  transferEmployee(id: string) {
    this.router.navigate(['/employees/transfer', id]);
  }

  deleteEmployee(id: string) {
    if (confirm('Are you sure you want to delete this employee?')) {
      this.employeeService.delete(id)
        .pipe(first())
        .subscribe(
          () => {
            this.employees = this.employees.filter(x => x.id !== id);
          },
          error => {
            console.error('Error deleting employee:', error);
          }
        );
    }
  }
} 