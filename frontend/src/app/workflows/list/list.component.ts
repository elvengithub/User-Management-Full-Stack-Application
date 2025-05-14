import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormControl } from '@angular/forms';
import { first } from 'rxjs/operators';

import { WorkflowService, AccountService } from '../../_services';

@Component({
  templateUrl: './list.component.html',
  styles: [`
    .transfer-details p {
      margin-bottom: 0.5rem;
    }
    .workflow-details p {
      margin-bottom: 0.5rem;
    }
    .dept-name {
      font-weight: bold;
      font-size: 1.1rem;
      color: #333;
    }
    .transfer-arrow {
      font-size: 1.5rem;
      color: #007bff;
      margin-top: 5px;
    }
    .transfer-details {
      padding: 10px;
      border-radius: 5px;
      background-color: #f8f9fa;
    }
  `]
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

  getObjectKeys(obj: any): string[] {
    if (!obj) return [];
    return Object.keys(obj);
  }

  formatLabel(key: string): string {
    // Convert camelCase to Title Case with spaces
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  getTransferFrom(details: any): string {
    if (!details) return 'N/A';
    
    // Handle different property naming conventions
    return details.oldDepartmentName || 
           details.fromDepartment || 
           details.oldDepartment ||
           details.sourceDepartment || 
           details.from || 
           'Unknown Department';
  }

  getTransferTo(details: any): string {
    if (!details) return 'N/A';
    
    // Handle different property naming conventions
    return details.newDepartmentName ||
           details.toDepartment || 
           details.newDepartment ||
           details.targetDepartment || 
           details.to || 
           'Unknown Department';
  }

  formatWorkflowDetails(details: any): string {
    if (!details) return 'No details available';
    
    try {
      // If it's a stringified JSON, handle it differently
      if (typeof details === 'string' && (details.startsWith('{') || details.startsWith('['))) {
        try {
          const parsedDetails = JSON.parse(details);
          return this.formatWorkflowDetailsObject(parsedDetails);
        } catch (e) {
          return details;
        }
      }
      
      return this.formatWorkflowDetailsObject(details);
    } catch (error) {
      console.error('Error formatting workflow details:', error);
      return 'Error displaying details';
    }
  }

  formatWorkflowDetailsObject(details: any): string {
    if (!details || typeof details !== 'object') return String(details);
    
    // Convert object to readable text
    return Object.keys(details)
      .filter(key => details[key] !== null && details[key] !== undefined)
      .map(key => {
        const label = this.formatLabel(key);
        let value = details[key];
        
        // Format the value if it's a nested object
        if (typeof value === 'object' && !Array.isArray(value)) {
          value = this.formatWorkflowDetailsObject(value);
        }
        
        return `${label}: ${value}`;
      })
      .join(', ');
  }

  isString(value: any): boolean {
    return typeof value === 'string' || value instanceof String;
  }
} 