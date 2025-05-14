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
  currentDepartmentId?: number;

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

    // Load departments first
    this.loading = true;
    this.departmentService.getAll()
      .pipe(first())
      .subscribe({
        next: departments => {
          this.departments = departments;
          // After loading departments, load the employee
          this.loadEmployee();
        },
        error: error => {
          console.error('Error loading departments:', error);
          this.loading = false;
          this.errorMessage = 'Failed to load departments: ' + error;
        }
      });
  }

  loadEmployee() {
    this.employeeService.getById(this.id)
      .pipe(first())
      .subscribe({
        next: employee => {
          this.employee = employee;
          this.currentDepartmentId = employee.departmentId;
          this.form.get('departmentId')?.setValue(employee.departmentId);
          this.loading = false;
        },
        error: error => {
          console.error('Error loading employee:', error);
          this.loading = false;
          this.errorMessage = 'Failed to load employee: ' + error;
          // Don't navigate away immediately, show the error
          setTimeout(() => this.router.navigate(['/employees']), 3000);
        }
      });
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

    // Get the department IDs as numbers
    const newDepartmentId = parseInt(this.form.value.departmentId);
    const currentDepartmentIdNum = this.currentDepartmentId ? parseInt(this.currentDepartmentId.toString()) : null;

    // Don't do anything if department hasn't changed
    if (currentDepartmentIdNum === newDepartmentId) {
      this.alertService.info('Employee is already in this department');
      return;
    }

    // Get the selected department name for better UI feedback
    const selectedDepartment = this.departments.find(d => parseInt(d.id) === newDepartmentId);
    const currentDepartment = this.departments.find(d => parseInt(d.id) === currentDepartmentIdNum);
    
    // Log the selected data
    console.log('Transfer data:', {
      employeeId: this.id,
      currentDepartmentId: currentDepartmentIdNum,
      newDepartmentId: newDepartmentId,
      currentDepartmentName: currentDepartment?.name || 'Unknown',
      newDepartmentName: selectedDepartment?.name || 'Unknown'
    });

    this.submitting = true;
    this.employeeService.transfer(this.id, newDepartmentId.toString())
      .pipe(first())
      .subscribe({
        next: (response) => {
          console.log('Transfer response:', response);
          this.alertService.success(`Employee transfer request submitted. ${selectedDepartment?.name || 'New department'} transfer is pending approval.`, { keepAfterRouteChange: true });
          this.router.navigate(['/employees']);
        },
        error: error => {
          console.error('Transfer error:', error);
          this.errorMessage = typeof error === 'string' ? error : 'Failed to transfer employee';
          this.submitting = false;
        }
      });
  }
} 