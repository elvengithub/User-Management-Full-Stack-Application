import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';

import { EmployeeService, DepartmentService, AlertService } from '../../_services';

@Component({
  templateUrl: './transfer.component.html'
})
export class TransferComponent implements OnInit {
  form!: FormGroup;
  id!: string;
  employee: any = null;
  departments: any[] = [];
  loading = false;
  submitting = false;
  submitted = false;
  errorMessage = '';

  constructor(
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private employeeService: EmployeeService,
    private departmentService: DepartmentService,
    private alertService: AlertService
  ) {}

  ngOnInit() {
    this.id = this.route.snapshot.params['id'];
    
    this.form = this.formBuilder.group({
      departmentId: ['', Validators.required]
    });

    // Load departments
    this.departmentService.getAll()
      .pipe(first())
      .subscribe(
        departments => {
          this.departments = departments;
        },
        error => {
          console.error('Error loading departments:', error);
        }
      );

    // Load employee details
    this.loading = true;
    this.employeeService.getById(this.id)
      .pipe(first())
      .subscribe(
        employee => {
          this.employee = employee;
          this.form.get('departmentId')?.setValue(employee.departmentId);
          this.loading = false;
        },
        error => {
          console.error('Error loading employee:', error);
          this.loading = false;
          this.router.navigate(['/employees']);
        }
      );
  }

  // convenience getter for easy access to form fields
  get f() { return this.form.controls; }

  onSubmit() {
    this.submitted = true;
    this.errorMessage = '';

    // reset alerts on submit
    this.alertService.clear();

    // stop here if form is invalid
    if (this.form.invalid) {
      return;
    }

    this.submitting = true;
    this.employeeService.transfer(this.id, this.form.value.departmentId)
      .pipe(first())
      .subscribe({
        next: () => {
          this.alertService.success('Employee transferred successfully', { keepAfterRouteChange: true });
          this.router.navigate(['/employees']);
        },
        error: error => {
          this.errorMessage = error;
          this.submitting = false;
        }
      });
  }
} 