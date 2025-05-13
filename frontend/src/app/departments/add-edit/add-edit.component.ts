import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';

import { DepartmentService, AlertService } from '../../_services';

@Component({
  templateUrl: './add-edit.component.html'
})
export class AddEditComponent implements OnInit {
  form!: FormGroup;
  id?: string;
  title!: string;
  loading = false;
  submitting = false;
  submitted = false;
  errorMessage = '';

  constructor(
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private departmentService: DepartmentService,
    private alertService: AlertService
  ) {}

  ngOnInit() {
    this.id = this.route.snapshot.params['id'];
    this.title = this.id ? 'Edit Department' : 'Add Department';

    this.form = this.formBuilder.group({
      name: ['', Validators.required],
      description: ['', Validators.required]
    });

    if (this.id) {
      this.loading = true;
      this.departmentService.getById(this.id)
        .pipe(first())
        .subscribe(
          department => {
            this.form.patchValue(department);
            this.loading = false;
          },
          error => {
            console.error('Error loading department:', error);
            this.loading = false;
          }
        );
    }
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
    this.saveDepartment()
      .pipe(first())
      .subscribe({
        next: () => {
          this.alertService.success('Department saved successfully', { keepAfterRouteChange: true });
          this.router.navigate(['/departments']);
        },
        error: error => {
          this.errorMessage = error;
          this.submitting = false;
        }
      });
  }

  private saveDepartment() {
    const department = this.form.value;
    return this.id
      ? this.departmentService.update(this.id, department)
      : this.departmentService.create(department);
  }
} 