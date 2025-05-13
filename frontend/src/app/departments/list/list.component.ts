import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { first } from 'rxjs/operators';

import { DepartmentService, AccountService } from '../../_services';

@Component({
  templateUrl: './list.component.html'
})
export class ListComponent implements OnInit {
  departments: any[] = [];
  loading = false;
  isAdmin = false;

  constructor(
    private departmentService: DepartmentService,
    private accountService: AccountService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loading = true;
    this.isAdmin = this.accountService.accountValue?.role === 'Admin';
    
    this.departmentService.getAll()
      .pipe(first())
      .subscribe(
        departments => {
          this.loading = false;
          this.departments = departments;
        },
        error => {
          console.error('Error loading departments:', error);
          this.loading = false;
        }
      );
  }

  editDepartment(id: string) {
    this.router.navigate(['/departments/edit', id]);
  }

  deleteDepartment(id: string) {
    if (confirm('Are you sure you want to delete this department?')) {
      this.departmentService.delete(id)
        .pipe(first())
        .subscribe(
          () => {
            this.departments = this.departments.filter(x => x.id !== id);
          },
          error => {
            console.error('Error deleting department:', error);
          }
        );
    }
  }
} 