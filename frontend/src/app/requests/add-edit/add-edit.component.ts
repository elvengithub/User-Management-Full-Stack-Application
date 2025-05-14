import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';

import { RequestService, EmployeeService, AccountService, AlertService } from '../../_services';

@Component({
  templateUrl: './add-edit.component.html'
})
export class AddEditComponent implements OnInit {
  form: FormGroup;
  id?: string;
  title!: string;
  loading = false;
  submitting = false;
  submitted = false;
  employees: any[] = [];
  errorMessage = '';
  isAdmin = false;

  constructor(
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private requestService: RequestService,
    private employeeService: EmployeeService,
    public accountService: AccountService,
    private alertService: AlertService
  ) {
    // Initialize form immediately to prevent null errors
    this.form = this.formBuilder.group({
      type: ['Equipment', Validators.required],
      employeeId: ['', Validators.required],
      items: this.formBuilder.array([]),
      status: ['Pending', Validators.required]
    });
  }

  ngOnInit() {
    this.id = this.route.snapshot.params['id'];
    this.title = this.id ? 'Edit Request' : 'Add Request';
    this.isAdmin = this.accountService.accountValue?.role === 'Admin';

    // Load employees
    this.employeeService.getAll()
      .pipe(first())
      .subscribe({
        next: employees => {
          this.employees = employees;
          
          // If user is not admin, set employeeId to current user's employee record
          if (!this.isAdmin) {
            const currentUserId = this.accountService.accountValue?.id;
            const userEmployee = employees.find((e: any) => e.userId === currentUserId);
            if (userEmployee) {
              this.form.get('employeeId')?.setValue(userEmployee.id);
              this.form.get('employeeId')?.disable();
            }
          }
        },
        error: error => {
          console.error('Error loading employees:', error);
        }
      });

    if (this.id) {
      this.loading = true;
      this.requestService.getById(this.id)
        .pipe(first())
        .subscribe({
          next: request => {
            this.form.patchValue({
              type: request.type,
              employeeId: request.employeeId,
              status: request.status
            });
            
            // Load items
            if (request.requestItems && request.requestItems.length) {
              request.requestItems.forEach((item: any) => {
                this.addItem(item.name, item.quantity);
              });
            }
            
            this.loading = false;
          },
          error: error => {
            console.error('Error loading request:', error);
            this.loading = false;
          }
        });
    } else {
      // Add default empty item
      this.addItem();
    }
  }

  // convenience getters for easy access to form fields
  get f() { return this.form.controls; }
  get itemsArray() { return this.f.items as FormArray; }
  get items() { return this.itemsArray.controls; }

  addItem(name = '', quantity = 1) {
    this.itemsArray.push(this.formBuilder.group({
      name: [name, Validators.required],
      quantity: [quantity, [Validators.required, Validators.min(1)]]
    }));
  }

  removeItem(index: number) {
    this.itemsArray.removeAt(index);
  }

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
    this.saveRequest()
      .pipe(first())
      .subscribe({
        next: () => {
          this.alertService.success('Request saved successfully', { keepAfterRouteChange: true });
          this.router.navigate(['/requests']);
        },
        error: error => {
          this.errorMessage = error;
          this.submitting = false;
        }
      });
  }

  private saveRequest() {
    // Enable disabled fields for submission
    if (this.form.get('employeeId')?.disabled) {
      this.form.get('employeeId')?.enable();
    }
    
    const request = this.form.value;
    
    return this.id
      ? this.requestService.update(this.id, request)
      : this.requestService.create(request);
  }
} 