import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormControl } from '@angular/forms';
import { first } from 'rxjs/operators';

import { WorkflowService, AccountService } from '../../_services';

@Component({
  templateUrl: './list.component.html'
})
export class ListComponent implements OnInit {
  workflows: any[] = [];
  loading = false;
  isAdmin = false;
  employeeId?: string;
  title = 'Workflows';

  constructor(
    private workflowService: WorkflowService,
    public accountService: AccountService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.loading = true;
    this.isAdmin = this.accountService.accountValue?.role === 'Admin';
    this.employeeId = this.route.snapshot.params['id'];
    
    if (this.employeeId) {
      this.title = `Workflows for Employee ${this.employeeId}`;
      this.workflowService.getByEmployee(this.employeeId)
        .pipe(first())
        .subscribe(
          workflows => {
            this.loading = false;
            this.workflows = workflows;
          },
          error => {
            console.error('Error loading workflows:', error);
            this.loading = false;
          }
        );
    } else {
      this.workflowService.getAll()
        .pipe(first())
        .subscribe(
          workflows => {
            this.loading = false;
            this.workflows = workflows;
          },
          error => {
            console.error('Error loading workflows:', error);
            this.loading = false;
          }
        );
    }
  }

  updateStatus(workflow: any, event: Event) {
    const status = (event.target as HTMLSelectElement).value;
    
    this.workflowService.updateStatus(workflow.id, status)
      .pipe(first())
      .subscribe(
        updatedWorkflow => {
          workflow.status = updatedWorkflow.status;
        },
        error => {
          console.error('Error updating workflow status:', error);
        }
      );
  }
} 