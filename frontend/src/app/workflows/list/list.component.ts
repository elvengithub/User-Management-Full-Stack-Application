import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormControl } from '@angular/forms';
import { first } from 'rxjs/operators';

import { WorkflowService, AccountService, RequestService } from '../../_services';

@Component({
  templateUrl: './list.component.html',
  styles: [`
    .transfer-details p {
      margin-bottom: 0.5rem;
    }
    .workflow-details p {
      margin-bottom: 0.5rem;
    }
    .request-details {
      padding: 10px;
      border-radius: 5px; 
      background-color: #f0f7ff;
    }
    .request-details p {
      margin-bottom: 0.5rem;
    }
    .request-details ul {
      margin-top: 0;
      padding-left: 20px;
    }
    .dept-name {
      font-weight: bold;
      font-size: 1.1rem;
      color: #333;
    }
    .text-muted {
      color: #6c757d !important;
    }
    .alert {
      position: relative;
      border: 1px solid transparent;
      border-radius: 0.25rem;
    }
    .alert-info {
      color: #0c5460;
      background-color: #d1ecf1;
      border-color: #bee5eb;
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
    private requestService: RequestService,
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
            this.processWorkflows(workflows);
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
            this.processWorkflows(workflows);
          },
          error => {
            console.error('Error loading workflows:', error);
            this.loading = false;
          }
        );
    }
  }

  processWorkflows(workflows: any[]) {
    // Process workflows to ensure data structure consistency
    this.workflows = workflows.map(workflow => {
      // Ensure details is an object
      if (typeof workflow.details === 'string') {
        try {
          workflow.details = JSON.parse(workflow.details);
        } catch (e) {
          console.error('Error parsing workflow details:', e);
        }
      }

      // Ensure details is initialized
      workflow.details = workflow.details || {};
      
      // Initialize items and requestItems if not present
      if (workflow.details) {
        workflow.details.items = workflow.details.items || [];
        workflow.details.requestItems = workflow.details.requestItems || [];
      }

      return workflow;
    });
    
    console.log('Processed workflows:', this.workflows);
  }

  updateStatus(workflow: any, event: Event) {
    const status = (event.target as HTMLSelectElement).value;
    
    console.log(`Updating workflow ID: ${workflow.id} from ${workflow.status} to ${status}`);
    
    // Update the workflow status
    this.workflowService.updateStatus(workflow.id, status)
      .pipe(first())
      .subscribe({
        next: (updatedWorkflow) => {
          console.log('Workflow updated successfully:', updatedWorkflow);
          workflow.status = updatedWorkflow.status;
          
          // If this was a transfer approval, show success message
          if (status === 'Approved' && 
              (workflow.type === 'Employee Transfer' || workflow.type === 'Transfer' || workflow.type === 'Department Transfer')) {
            alert('Transfer approved and applied successfully!');
          }
          
          // For Request workflows, also update the corresponding request status
          if ((workflow.type === 'Request Created' || workflow.type === 'Request Status Update') && 
              status === 'Approved' && 
              workflow.details?.requestId) {
              
            console.log(`Updating related request ${workflow.details.requestId} to status ${status}`);
            
            // Update the request status to match the workflow status
            this.requestService.updateStatus(workflow.details.requestId, status)
              .pipe(first())
              .subscribe({
                next: (updatedRequest) => {
                  console.log('Request updated successfully:', updatedRequest);
                  // Also update the workflow details to reflect the new request status
                  if (workflow.details) {
                    workflow.details.requestStatus = status;
                  }
                  
                  // Show success alert for request approval
                  alert(`Request ${workflow.details.requestType || ''} has been approved successfully!`);
                },
                error: (error) => {
                  console.error(`Error updating related request ${workflow.details.requestId}:`, error);
                  alert(`The workflow was updated, but there was an error updating the request: ${error.message || 'Unknown error'}`);
                }
              });
          }
        },
        error: (error) => {
          console.error('Error updating workflow status:', error);
          alert(`Failed to update status: ${error.message || 'Unknown error'}`);
        }
      });
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
           details.fromDepartmentName ||
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
           details.toDepartmentName ||
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
      
      // Special case for request created workflows
      if (details.requestType) {
        let message = `${details.requestType || 'General Request'}`;
        if (details.itemCount) {
          message += ` with ${details.itemCount} item(s)`;
        }
        return message;
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