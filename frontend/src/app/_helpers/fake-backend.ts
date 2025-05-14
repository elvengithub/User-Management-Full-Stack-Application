import { Injectable } from '@angular/core';
import { HttpRequest, HttpResponse, HttpHandler, HttpEvent, HttpInterceptor, HTTP_INTERCEPTORS, HttpHeaders } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { delay, materialize, dematerialize } from 'rxjs/operators';

import { AlertService } from '../../app/_services';
import { Role } from '../../app/_models';

// Local storage keys
const accountsKey = 'angular-10-signup-verification-boilerplate-accounts';
const employeesKey = 'user-management-app-employees';
const departmentsKey = 'user-management-app-departments';
const workflowsKey = 'user-management-app-workflows';
const requestsKey = 'user-management-app-requests';

// Initialize data from localStorage
let accounts = JSON.parse(localStorage.getItem(accountsKey) || '[]');
let employees = JSON.parse(localStorage.getItem(employeesKey) || '[]');
let departments = JSON.parse(localStorage.getItem(departmentsKey) || '[]');
let workflows = JSON.parse(localStorage.getItem(workflowsKey) || '[]');
let requests = JSON.parse(localStorage.getItem(requestsKey) || '[]');

// Patch old accounts in localStorage to ensure refreshTokens exist and add online status
accounts = accounts.map(acc => {
    if (!acc.refreshTokens) acc.refreshTokens = [];
    if (acc.isOnline === undefined) acc.isOnline = Math.random() > 0.5;
    if (acc.lastActive === undefined) acc.lastActive = new Date().toISOString();
    if (acc.acceptTerms === undefined) acc.acceptTerms = true;
    return acc;
});
localStorage.setItem(accountsKey, JSON.stringify(accounts));

// Initialize some data if empty
if (departments.length === 0) {
    departments = [
        { id: 1, name: 'Engineering', description: 'Software development team', employeeCount: 1 },
        { id: 2, name: 'Marketing', description: 'Marketing team', employeeCount: 1 },
        { id: 3, name: 'Finance', description: 'Finance department', employeeCount: 0 },
        { id: 4, name: 'Sales', description: 'Sales team', employeeCount: 0 }
    ];
    localStorage.setItem(departmentsKey, JSON.stringify(departments));
}

if (employees.length === 0) {
    employees = [
        { id: 1, employeeId: 'EMP001', userId: 1, position: 'Developer', departmentId: 1, hireDate: '2025-01-01', status: 'Active' },
        { id: 2, employeeId: 'EMP002', userId: 2, position: 'Designer', departmentId: 2, hireDate: '2025-02-01', status: 'Active' }
    ];
    localStorage.setItem(employeesKey, JSON.stringify(employees));
}

if (workflows.length === 0) {
    workflows = [
        { id: 1, employeeId: 1, type: 'Onboarding', details: { task: 'Setup workstation' }, status: 'Pending' }
    ];
    localStorage.setItem(workflowsKey, JSON.stringify(workflows));
}

if (requests.length === 0) {
    requests = [
        { id: 1, employeeId: 2, type: 'Equipment', requestItems: [{ name: 'Laptop', quantity: 1 }], status: 'Pending' }
    ];
    localStorage.setItem(requestsKey, JSON.stringify(requests));
}

@Injectable()
export class FakeBackendInterceptor implements HttpInterceptor {
    constructor(private alertService: AlertService) { }

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        const { url, method, headers, body } = request;
        const alertService = this.alertService;

        return handleRoute();

        function handleRoute() {
            switch (true) {
                case url.endsWith('/accounts/authenticate') && method === 'POST':
                    return authenticate();
                case url.endsWith('/accounts/refresh-token') && method === 'POST':
                    return refreshToken();
                case url.endsWith('/accounts/revoke-token') && method === 'POST':
                    return revokeToken();
                case url.endsWith('/accounts/register') && method === 'POST':
                    return register();
                case url.endsWith('/accounts/verify-email') && method === 'POST':
                    return verifyEmail();
                case url.endsWith('/accounts/forgot-password') && method === 'POST':
                    return forgotPassword();
                case url.endsWith('/accounts/validate-reset-token') && method === 'POST':
                    return validateResetToken();
                case url.endsWith('/accounts/reset-password') && method === 'POST':
                    return resetPassword();
                case url.endsWith('/accounts') && method === 'GET':
                    return getAccounts();
                case url.match(/\/accounts\/\d+$/) && method === 'GET':
                    return getAccountById();
                case url.endsWith('/accounts') && method === 'POST':
                    return createAccount();
                case url.match(/\/accounts\/\d+$/) && method === 'PUT':
                    return updateAccount();
                case url.match(/\/accounts\/\d+$/) && method === 'DELETE':
                    return deleteAccount();
                case url.endsWith('/analytics/user-stats') && method === 'GET':
                    return getUserStats();
                case url.endsWith('/analytics/online-users') && method === 'GET':
                    return getOnlineUsers();
                    
                // Employee Routes
                case url.endsWith('/employees') && method === 'GET':
                    return getEmployees();
                case url.match(/\/employees\/\d+$/) && method === 'GET':
                    return getEmployeeById();
                case url.endsWith('/employees') && method === 'POST':
                    return createEmployee();
                case url.match(/\/employees\/\d+$/) && method === 'PUT':
                    return updateEmployee();
                case url.match(/\/employees\/\d+$/) && method === 'DELETE':
                    return deleteEmployee();
                case url.match(/\/employees\/\d+\/transfer$/) && method === 'POST':
                    return transferEmployee();
                    
                // Department Routes
                case url.endsWith('/departments') && method === 'GET':
                    return getDepartments();
                case url.match(/\/departments\/\d+$/) && method === 'GET':
                    return getDepartmentById();
                case url.endsWith('/departments') && method === 'POST':
                    return createDepartment();
                case url.match(/\/departments\/\d+$/) && method === 'PUT':
                    return updateDepartment();
                case url.match(/\/departments\/\d+$/) && method === 'DELETE':
                    return deleteDepartment();
                    
                // Workflow Routes
                case url.endsWith('/workflows') && method === 'GET':
                    return getWorkflows();
                case url.match(/\/workflows\/employee\/\d+$/) && method === 'GET':
                    return getWorkflowsByEmployee();
                case url.match(/\/workflows\/\d+$/) && method === 'GET':
                    return getWorkflowById();
                case url.endsWith('/workflows') && method === 'POST':
                    return createWorkflow();
                case url.match(/\/workflows\/\d+\/status$/) && method === 'PUT':
                    return updateWorkflowStatus();
                    
                // Request Routes
                case url.endsWith('/requests') && method === 'GET':
                    return getRequests();
                case url.match(/\/requests\/employee\/\d+$/) && method === 'GET':
                    return getRequestsByEmployee();
                case url.match(/\/requests\/\d+$/) && method === 'GET':
                    return getRequestById();
                case url.endsWith('/requests') && method === 'POST':
                    return createRequest();
                case url.match(/\/requests\/\d+$/) && method === 'PUT':
                    return updateRequest();
                case url.match(/\/requests\/\d+\/status$/) && method === 'PUT':
                    return updateRequestStatus();
                case url.match(/\/requests\/\d+$/) && method === 'DELETE':
                    return deleteRequest();
                    
                default:
                    return next.handle(request);
            }
        }

        // Employee Routes
        
        function getEmployees() {
            if (!isAuthorized()) return unauthorized();
            
            // Add user information to each employee
            const employeesWithUsers = employees.map(employee => {
                const user = accounts.find(a => a.id === employee.userId);
                const department = departments.find(d => d.id === employee.departmentId);
                return {
                    ...employee,
                    user: user ? basicDetails(user) : null,
                    department: department || null
                };
            });
            
            return ok(employeesWithUsers);
        }
        
        function getEmployeeById() {
            if (!isAuthorized()) return unauthorized();
            
            const id = idFromUrl();
            const employee = employees.find(e => e.id === id);
            
            if (!employee) return notFound();
            
            return ok(employee);
        }
        
        function createEmployee() {
            if (!isAuthorized(Role.Admin)) return unauthorized();
            
            const employee = body;
            employee.id = employees.length ? Math.max(...employees.map(x => x.id)) + 1 : 1;
            employees.push(employee);
            localStorage.setItem(employeesKey, JSON.stringify(employees));
            
            return ok(employee);
        }
        
        function updateEmployee() {
            if (!isAuthorized(Role.Admin)) return unauthorized();
            
            const id = idFromUrl();
            const index = employees.findIndex(e => e.id === id);
            
            if (index === -1) return notFound();
            
            employees[index] = { ...employees[index], ...body, id };
            localStorage.setItem(employeesKey, JSON.stringify(employees));
            
            return ok(employees[index]);
        }
        
        function deleteEmployee() {
            if (!isAuthorized(Role.Admin)) return unauthorized();
            
            const id = idFromUrl();
            employees = employees.filter(e => e.id !== id);
            localStorage.setItem(employeesKey, JSON.stringify(employees));
            
            return ok();
        }
        
        function transferEmployee() {
            if (!isAuthorized(Role.Admin)) return unauthorized();
            
            const id = idFromUrl();
            const employee = employees.find(e => e.id === id);
            
            if (!employee) return notFound();
            
            // Update employee department
            employee.departmentId = body.departmentId;
            localStorage.setItem(employeesKey, JSON.stringify(employees));
            
            // Create transfer workflow
            const workflow = {
                id: workflows.length ? Math.max(...workflows.map(x => x.id)) + 1 : 1,
                employeeId: id,
                type: 'Transfer',
                details: body,
                status: 'Pending'
            };
            workflows.push(workflow);
            localStorage.setItem(workflowsKey, JSON.stringify(workflows));
            
            return ok({ message: 'Employee transferred' });
        }
        
        // Department Routes
        
        function getDepartments() {
            return ok(departments);
        }
        
        function getDepartmentById() {
            const id = idFromUrl();
            const department = departments.find(d => d.id === id);
            
            if (!department) return notFound();
            
            return ok(department);
        }
        
        function createDepartment() {
            if (!isAuthorized(Role.Admin)) return unauthorized();
            
            const department = body;
            department.id = departments.length ? Math.max(...departments.map(x => x.id)) + 1 : 1;
            department.employeeCount = 0;
            departments.push(department);
            localStorage.setItem(departmentsKey, JSON.stringify(departments));
            
            return ok(department);
        }
        
        function updateDepartment() {
            if (!isAuthorized(Role.Admin)) return unauthorized();
            
            const id = idFromUrl();
            const index = departments.findIndex(d => d.id === id);
            
            if (index === -1) return notFound();
            
            departments[index] = { ...departments[index], ...body, id };
            localStorage.setItem(departmentsKey, JSON.stringify(departments));
            
            return ok(departments[index]);
        }
        
        function deleteDepartment() {
            if (!isAuthorized(Role.Admin)) return unauthorized();
            
            const id = idFromUrl();
            departments = departments.filter(d => d.id !== id);
            localStorage.setItem(departmentsKey, JSON.stringify(departments));
            
            return ok();
        }
        
        // Workflow Routes
        
        function getWorkflows() {
            if (!isAuthorized()) return unauthorized();
            
            return ok(processWorkflows(workflows));
        }
        
        function getWorkflowsByEmployee() {
            if (!isAuthorized()) return unauthorized();
            
            const employeeId = idFromUrl();
            const employeeWorkflows = workflows.filter(w => w.employeeId === employeeId);
            
            return ok(processWorkflows(employeeWorkflows));
        }
        
        function getWorkflowById() {
            if (!isAuthorized()) return unauthorized();
            
            const id = idFromUrl();
            const workflow = workflows.find(w => w.id === id);
            
            if (!workflow) return notFound();
            
            return ok(processWorkflowDetails(workflow));
        }
        
        function createWorkflow() {
            if (!isAuthorized()) return unauthorized();
            
            const workflow = body;
            workflow.id = workflows.length ? Math.max(...workflows.map(x => x.id)) + 1 : 1;
            
            // If no status is provided, set it to Pending
            if (!workflow.status) workflow.status = 'Pending';
            
            workflows.push(workflow);
            localStorage.setItem(workflowsKey, JSON.stringify(workflows));
            
            return ok(workflow);
        }
        
        function updateWorkflowStatus() {
            if (!isAuthorized(Role.Admin)) return unauthorized();
            
            const id = idFromUrl();
            const workflow = workflows.find(w => w.id === id);
            
            if (!workflow) return notFound();
            
            const oldStatus = workflow.status;
            const newStatus = body.status;
            
            // Update workflow status
            workflow.status = newStatus;
            localStorage.setItem(workflowsKey, JSON.stringify(workflows));
            
            // If this is a request workflow, update the corresponding request
            if ((workflow.type === 'Request Created' || workflow.type === 'Request Status Update') && 
                workflow.details && workflow.details.requestId) {
                
                const requestId = workflow.details.requestId;
                const request = requests.find(r => r.id === requestId);
                
                if (request) {
                    // Update the request status to match the workflow
                    request.status = newStatus;
                    localStorage.setItem(requestsKey, JSON.stringify(requests));
                    
                    // Update the workflow details to reflect the request status
                    workflow.details.requestStatus = newStatus;
                    workflow.details.oldStatus = oldStatus;
                    workflow.details.newStatus = newStatus;
                    localStorage.setItem(workflowsKey, JSON.stringify(workflows));
                    
                    // Create a status update workflow
                    const statusUpdateWorkflow = {
                        id: workflows.length ? Math.max(...workflows.map(x => x.id)) + 1 : 1,
                        employeeId: request.employeeId,
                        type: 'Request Status Update',
                        status: 'Completed',
                        details: {
                            requestId: request.id,
                            requestType: request.type,
                            oldStatus: oldStatus,
                            newStatus: newStatus,
                            requestStatus: newStatus,
                            message: `Request status changed from ${oldStatus} to ${newStatus}`,
                            requestItems: request.requestItems,
                            items: request.requestItems.map(item => `${item.name} (x${item.quantity})`)
                        }
                    };
                    
                    // Only add the update workflow if we're changing status, not if we're just viewing
                    if (oldStatus !== newStatus) {
                        workflows.push(statusUpdateWorkflow);
                        localStorage.setItem(workflowsKey, JSON.stringify(workflows));
                    }
                }
            }
            
            // If this is a transfer workflow and it's approved, update employee department
            if ((workflow.type === 'Employee Transfer' || workflow.type === 'Transfer' || 
                 workflow.type === 'Department Transfer') && newStatus === 'Approved') {
                
                const employeeId = workflow.employeeId;
                const employee = employees.find(e => e.id === employeeId);
                
                if (employee && workflow.details) {
                    const newDepartmentId = workflow.details.departmentId || 
                                            workflow.details.newDepartmentId;
                    
                    if (newDepartmentId) {
                        // Update employee department
                        employee.departmentId = parseInt(newDepartmentId);
                        localStorage.setItem(employeesKey, JSON.stringify(employees));
                    }
                }
            }
            
            return ok(processWorkflowDetails(workflow));
        }
        
        // Request Routes
        
        function getRequests() {
            if (!isAuthorized(Role.Admin)) return unauthorized();
            
            // Add employee information to requests
            const requestsWithEmployees = requests.map(request => {
                const employee = employees.find(e => e.id === request.employeeId);
                return {
                    ...request,
                    employee: employee || null
                };
            });
            
            return ok(requestsWithEmployees);
        }
        
        function getRequestsByEmployee() {
            if (!isAuthorized()) return unauthorized();
            
            const employeeId = idFromUrl();
            const employeeRequests = requests.filter(r => r.employeeId === employeeId);
            
            return ok(employeeRequests);
        }
        
        function getRequestById() {
            if (!isAuthorized()) return unauthorized();
            
            const id = idFromUrl();
            const request = requests.find(r => r.id === id);
            
            if (!request) return notFound();
            
            // Add employee information
            const employee = employees.find(e => e.id === request.employeeId);
            const fullRequest = {
                ...request,
                employee: employee || null
            };
            
            return ok(fullRequest);
        }
        
        function createRequest() {
            if (!isAuthorized()) return unauthorized();
            
            const request = body;
            request.id = requests.length ? Math.max(...requests.map(x => x.id)) + 1 : 1;
            
            // If no status is provided, set it to Pending
            if (!request.status) request.status = 'Pending';
            
            // Ensure requestItems is an array
            if (!request.requestItems) request.requestItems = [];
            
            // Get user from token and set employeeId if not provided
            if (!request.employeeId) {
                const userAccount = currentAccount();
                if (userAccount) {
                    const employee = employees.find(e => e.userId === userAccount.id);
                    if (employee) {
                        request.employeeId = employee.id;
                    }
                }
            }
            
            requests.push(request);
            localStorage.setItem(requestsKey, JSON.stringify(requests));
            
            // Create a workflow for the request
            const workflow = {
                id: workflows.length ? Math.max(...workflows.map(x => x.id)) + 1 : 1,
                employeeId: request.employeeId,
                type: 'Request Created',
                status: 'Completed',
                details: {
                    requestId: request.id,
                    requestType: request.type,
                    requestStatus: 'Pending',
                    itemCount: request.requestItems.length,
                    requestItems: request.requestItems,
                    items: request.requestItems.map(item => `${item.name} (x${item.quantity})`),
                    description: request.description || '',
                    message: `New ${request.type} request created with ${request.requestItems.length} item(s)`
                }
            };
            
            workflows.push(workflow);
            localStorage.setItem(workflowsKey, JSON.stringify(workflows));
            
            return ok(request);
        }
        
        function updateRequest() {
            if (!isAuthorized(Role.Admin)) return unauthorized();
            
            const id = idFromUrl();
            const index = requests.findIndex(r => r.id === id);
            
            if (index === -1) return notFound();
            
            const oldStatus = requests[index].status;
            requests[index] = { ...requests[index], ...body, id };
            localStorage.setItem(requestsKey, JSON.stringify(requests));
            
            // If status changed, create a workflow
            if (body.status && oldStatus !== body.status) {
                const statusWorkflow = {
                    id: workflows.length ? Math.max(...workflows.map(x => x.id)) + 1 : 1,
                    employeeId: requests[index].employeeId,
                    type: 'Request Status Update',
                    status: 'Completed',
                    details: {
                        requestId: id,
                        requestType: requests[index].type,
                        oldStatus: oldStatus,
                        newStatus: body.status,
                        requestStatus: body.status,
                        itemCount: requests[index].requestItems.length,
                        requestItems: requests[index].requestItems,
                        items: requests[index].requestItems.map(item => `${item.name} (x${item.quantity})`),
                        message: `Request #${id} status changed from ${oldStatus} to ${body.status}`
                    }
                };
                
                workflows.push(statusWorkflow);
                localStorage.setItem(workflowsKey, JSON.stringify(workflows));
            }
            
            return ok(requests[index]);
        }
        
        function updateRequestStatus() {
            if (!isAuthorized(Role.Admin)) return unauthorized();
            
            const id = idFromUrl();
            const request = requests.find(r => r.id === id);
            
            if (!request) return notFound();
            
            const oldStatus = request.status;
            const newStatus = body.status;
            
            // Update request status
            request.status = newStatus;
            localStorage.setItem(requestsKey, JSON.stringify(requests));
            
            // Create a workflow for the status change
            const statusWorkflow = {
                id: workflows.length ? Math.max(...workflows.map(x => x.id)) + 1 : 1,
                employeeId: request.employeeId,
                type: 'Request Status Update',
                status: 'Completed',
                details: {
                    requestId: id,
                    requestType: request.type,
                    oldStatus: oldStatus,
                    newStatus: newStatus,
                    requestStatus: newStatus,
                    itemCount: request.requestItems.length,
                    requestItems: request.requestItems,
                    items: request.requestItems.map(item => `${item.name} (x${item.quantity})`),
                    message: `Request #${id} status changed from ${oldStatus} to ${newStatus}`
                }
            };
            
            workflows.push(statusWorkflow);
            localStorage.setItem(workflowsKey, JSON.stringify(workflows));
            
            return ok(request);
        }
        
        function deleteRequest() {
            if (!isAuthorized(Role.Admin)) return unauthorized();
            
            const id = idFromUrl();
            requests = requests.filter(r => r.id !== id);
            localStorage.setItem(requestsKey, JSON.stringify(requests));
            
            return ok();
        }
        
        // Helper Functions
        
        function processWorkflows(workflowsList) {
            return workflowsList.map(workflow => processWorkflowDetails(workflow));
        }
        
        function processWorkflowDetails(workflow) {
            // Clone to avoid modifying original
            const processedWorkflow = { ...workflow };
            
            // For request workflows, add request details
            if ((workflow.type === 'Request Created' || workflow.type === 'Request Status Update') && 
                workflow.details && workflow.details.requestId) {
                
                const requestId = workflow.details.requestId;
                const request = requests.find(r => r.id === requestId);
                
                if (request) {
                    // Ensure details is an object
                    if (typeof processedWorkflow.details === 'string') {
                        try {
                            processedWorkflow.details = JSON.parse(processedWorkflow.details);
                        } catch (e) {
                            processedWorkflow.details = {};
                        }
                    }
                    
                    // Add request details to workflow
                    processedWorkflow.details = {
                        ...processedWorkflow.details,
                        requestType: request.type,
                        requestStatus: request.status,
                        requestItems: request.requestItems,
                        itemCount: request.requestItems.length,
                        items: request.requestItems.map(item => `${item.name} (x${item.quantity})`)
                    };
                }
            }
            
            // For transfer workflows, add department names
            if (workflow.type === 'Employee Transfer' || workflow.type === 'Transfer' || 
                workflow.type === 'Department Transfer') {
                
                // Ensure details is an object
                if (typeof processedWorkflow.details === 'string') {
                    try {
                        processedWorkflow.details = JSON.parse(processedWorkflow.details);
                    } catch (e) {
                        processedWorkflow.details = {};
                    }
                }
                
                // Add department names
                const oldDeptId = processedWorkflow.details.oldDepartmentId || null;
                const newDeptId = processedWorkflow.details.departmentId || 
                                processedWorkflow.details.newDepartmentId || null;
                
                if (oldDeptId) {
                    const oldDept = departments.find(d => d.id === parseInt(oldDeptId));
                    if (oldDept) {
                        processedWorkflow.details.oldDepartmentName = oldDept.name;
                        processedWorkflow.details.fromDepartment = oldDept.name;
                        processedWorkflow.details.from = oldDept.name;
                    }
                }
                
                if (newDeptId) {
                    const newDept = departments.find(d => d.id === parseInt(newDeptId));
                    if (newDept) {
                        processedWorkflow.details.newDepartmentName = newDept.name;
                        processedWorkflow.details.toDepartment = newDept.name;
                        processedWorkflow.details.to = newDept.name;
                    }
                }
            }
            
            return processedWorkflow;
        }

        function isAuthorized(role?) {
            const account = currentAccount();
            if (!account) return false;
            if (role) {
                return account.role === role;
            }
            return true;
        }
        
        // Analytics functions and account handling functions remain intact...

        function ok(body?) {
            return of(new HttpResponse({ status: 200, body }))
                .pipe(delay(500)); //delay observable to simulate server api call
        }

        function error(message) {
            return throwError({ error: { message } })
                .pipe(materialize(), delay(500), dematerialize());
            //call materialize and dematerialize to ensure delay even if an error is thrown 
        }

        function unauthorized() {
            return throwError({ status: 401, error: { message: 'Unauthorized' } })
                .pipe(materialize(), delay(500), dematerialize());
        }
        
        function notFound() {
            return throwError({ status: 404, error: { message: 'Not Found' } })
                .pipe(materialize(), delay(500), dematerialize());
        }

        function basicDetails(account) {
            const { id, title, firstName, lastName, email, role, dateCreated, isVerified, status, acceptTerms } = account;
            return { id, title, firstName, lastName, email, role, dateCreated, isVerified, status, acceptTerms };
        }

        function isAuthenticated() {
            return !!currentAccount();
        }

        function idFromUrl() {
            const urlParts = url.split('/');
            return parseInt(urlParts[urlParts.length - 1]);
        }

        function newAccountId() {
            return accounts.length ? Math.max(...accounts.map(x => x.id || 0)) + 1 : 1;
        }

        function currentAccount() {
            // check if jwt token is in auth header
            const authHeader = headers.get('Authorization');
            if (!authHeader || !authHeader.startsWith('Bearer fake-jwt-token')) return;

            //check if token is expired
            const jwtToken = JSON.parse(atob(authHeader.split('.')[1]));
            const tokenExpired = Date.now() > (jwtToken.exp * 1000);
            if (tokenExpired) return;

            const account = accounts.find(x => x.id === jwtToken.id);
            return account;
        }

        function generateJwtToken(account) {
            // create token that expires in 15 minutes
            const tokenPayload = {
                exp: Math.round(new Date(Date.now() + 15 * 60 * 1000).getTime() / 1000),
                id: account.id,
            }
            return `fake-jwt-token.${btoa(JSON.stringify(tokenPayload))}`;
        }

        function generateRefreshToken() {
            const token = new Date().getTime().toString();

            // add token cookie that expires in 7 days
            const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toUTCString();
            document.cookie = `fakeRefreshToken=${token}; expires=${expires}; path=/`;

            return token;
        }

        function getRefreshToken() {
            // get refresh token from cookie
            return (document.cookie.split(';').find(x => x.includes('fakeRefreshToken')) || '=').split('=')[1];
        }

        // Account functions
        function authenticate() {
            const { email, password } = body;
            const account = accounts.find(x => x.email === email);

            if (!account) return error('Email does not exist');
            if (!account.isVerified) {
                setTimeout(() => {
                    const verifyUrl = `${location.origin}/account/verify-email?token=${account.verificationToken}`;
                    alertService.info(
                        `<h4>Account Not Verified</h4>
                        <p>Please verify your email address to continue:</p>
                        <p><a href="${verifyUrl}">${verifyUrl}</a></p>`,
                        { autoClose: false }
                    );
                }, 1000);
                return error('Account not verified');
            }
            if (account.status === 'Inactive') {
                return error('Your account is inactive. Please contact an administrator to activate your account.');
            }
            if (account.password !== password) return error('Password is incorrect');

            // Set account to online
            account.isOnline = true;
            account.lastActive = new Date().toISOString();

            // add refresh token to account
            if (!account.refreshTokens) account.refreshTokens = [];
            account.refreshTokens.push(generateRefreshToken());
            localStorage.setItem(accountsKey, JSON.stringify(accounts));

            return ok({
                ...basicDetails(account),
                jwtToken: generateJwtToken(account)
            });
        }

        function refreshToken() {
            const refreshToken = getRefreshToken();

            if (!refreshToken) return unauthorized();

            const account = accounts.find(x => x.refreshTokens && x.refreshTokens.includes(refreshToken));

            if (!account) return unauthorized();

            // Update active status
            account.lastActive = new Date().toISOString();

            // replace old refresh token with new one and save
            account.refreshTokens = account.refreshTokens.filter(x => x !== refreshToken);
            account.refreshTokens.push(generateRefreshToken());
            localStorage.setItem(accountsKey, JSON.stringify(accounts));

            return ok({
                ...basicDetails(account),
                jwtToken: generateJwtToken(account)
            });
        }

        function revokeToken() {
            if (!isAuthenticated()) return unauthorized();

            const refreshToken = getRefreshToken();
            const account = accounts.find(x => x.refreshTokens && x.refreshTokens.includes(refreshToken));

            if (!account) return unauthorized();

            // Set account to offline when token is revoked (logout)
            account.isOnline = false;
            account.lastActive = new Date().toISOString();

            account.refreshTokens = account.refreshTokens.filter(x => x !== refreshToken);
            localStorage.setItem(accountsKey, JSON.stringify(accounts));

            return ok();
        }

        function register() {
            const account = body;
            account.refreshTokens = [];
            account.dateCreated = new Date().toISOString();
            
            if (accounts.length === 0) {
                // First user is Admin
                account.role = Role.Admin;
                account.isVerified = true;
                account.status = 'Active';
                account.id = newAccountId();
                accounts.push(account);
                localStorage.setItem(accountsKey, JSON.stringify(accounts));
                
                setTimeout(() => {
                    alertService.success('Registration successful! You can now log in.', { autoClose: true });
                }, 1000);
                
                return ok({
                    message: 'Registration successful. You can now login.'
                });
            } else {
                // Regular users
                account.role = Role.User;
                account.isVerified = false;
                account.status = 'Inactive';
                account.id = newAccountId();
                account.verificationToken = new Date().getTime().toString();
                accounts.push(account);
                localStorage.setItem(accountsKey, JSON.stringify(accounts));

                setTimeout(() => {
                    const verifyUrl = `${location.origin}/account/verify-email?token=${account.verificationToken}`;
                    alertService.info(
                        `<h4>Verification Email</h4>
                        <p>Thanks for registering!</p>
                        <p>Please click the below link to verify your email address:</p>
                        <p><a href="${verifyUrl}">${verifyUrl}</a></p>
                        <p>After verification, please wait for an administrator to activate your account before you can log in.</p>
                        <div><strong>NOTE:</strong> The fake backend displayed this "email" so you can test without an api. A real backend would send a real email.</div>`,
                        { autoClose: false }
                    );
                }, 1000);
                
                return ok({
                    message: 'Registration successful, please check your email for verification instructions'
                });
            }
        }

        function verifyEmail() {
            const { token } = body;
            const account = accounts.find(x => !!x.verificationToken && x.verificationToken === token);

            if (!account) return error('Verification failed');

            account.isVerified = true;
            account.status = 'Active';
            localStorage.setItem(accountsKey, JSON.stringify(accounts));

            // Show success message
            setTimeout(() => {
                alertService.success('Email verified successfully! Your account is now active and you can log in.', { autoClose: true });
            }, 1000);

            return ok();
        }

        function forgotPassword() {
            const { email } = body;
            const account = accounts.find(x => x.email === email);

            if (!account) return ok();

            account.resetToken = new Date().getTime().toString();
            account.resetTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
            localStorage.setItem(accountsKey, JSON.stringify(accounts));

            setTimeout(() => {
                const resetUrl = `${location.origin}/account/reset-password?token=${account.resetToken}`;
                alertService.info(
                    `<h4>Reset Password Email</h4>
                <p>Please click the below link to reset your password, the link will be valid for 1 day:</p>
                <p><a href="${resetUrl}">${resetUrl}</a></p>
                <div><strong>NOTE:</strong> The fake backend displayed this "email" so you can test without an api. A real backend would send a real email.</div>`,
                    { autoClose: false }
                );
            }, 1000);

            return ok();
        }

        function validateResetToken() {
            const { token } = body;
            const account = accounts.find(x =>
                !!x.resetToken &&
                x.resetToken === token &&
                new Date() < new Date(x.resetTokenExpires)
            );

            if (!account) return error('Invalid token');

            return ok();
        }

        function resetPassword() {
            const { token, password } = body;
            const account = accounts.find(x =>
                !!x.resetToken &&
                x.resetToken === token &&
                new Date() < new Date(x.resetTokenExpires)
            );

            if (!account) return error('Invalid token');

            account.password = password;
            account.resetToken = null;
            account.resetTokenExpires = null;
            localStorage.setItem(accountsKey, JSON.stringify(accounts));

            return ok();
        }

        function getAccounts() {
            if (!isAuthorized(Role.Admin)) return unauthorized();

            // Ensure all accounts have valid IDs
            accounts = accounts.map(acc => {
                if (!acc.refreshTokens) acc.refreshTokens = [];
                
                // Ensure account has a valid ID
                if (!acc.id || isNaN(acc.id)) {
                    acc.id = newAccountId();
                }
                return acc;
            });
            localStorage.setItem(accountsKey, JSON.stringify(accounts));
            
            return ok(accounts.map(x => basicDetails(x)));
        }

        function getAccountById() {
            if (!isAuthenticated()) return unauthorized();

            let account = accounts.find(x => x.id === idFromUrl());
            
            if (!account) return notFound();
            
            if (account.id !== currentAccount().id && !isAuthorized(Role.Admin)) {
                return unauthorized();
            }

            return ok(basicDetails(account));
        }

        function createAccount() {
            if (!isAuthorized(Role.Admin)) return unauthorized();

            const account = body;
            account.refreshTokens = [];
            
            if (accounts.find(x => x.email === account.email)) {
                return error(`Email ${account.email} is already registered`);
            }

            // Ensure acceptTerms is true when admin creates an account
            account.acceptTerms = true;
            account.id = newAccountId();
            account.dateCreated = new Date().toISOString();
            account.lastActive = new Date().toISOString();
            account.isOnline = false;
            // Force all created accounts to be regular users
            account.role = Role.User;
            account.isVerified = true;
            account.status = 'Active';
            delete account.confirmPassword;
            accounts.push(account);
            localStorage.setItem(accountsKey, JSON.stringify(accounts));

            // Show success message for admin-created accounts
            setTimeout(() => {
                alertService.success('Account created successfully! The account is verified and active.', { autoClose: true });
            }, 1000);

            return ok();
        }

        function updateAccount() {
            if (!isAuthenticated()) return unauthorized();

            const params = body;
            let account = accounts.find(x => x.id === idFromUrl());
            
            if (!account) return notFound();

            if (account.id !== currentAccount().id && !isAuthorized(Role.Admin)) {
                return unauthorized();
            }

            // Only update password if it's provided and not empty
            if (params.password) {
                account.password = params.password;
            }

            // Remove password and confirmPassword from params to avoid overwriting
            delete params.password;
            delete params.confirmPassword;

            // Update other fields
            Object.assign(account, params);
            localStorage.setItem(accountsKey, JSON.stringify(accounts));

            return ok(basicDetails(account));
        }

        function deleteAccount() {
            if (!isAuthenticated()) return unauthorized();

            let account = accounts.find(x => x.id === idFromUrl());
            
            if (!account) return notFound();

            if (account.id !== currentAccount().id && !isAuthorized(Role.Admin)) {
                return unauthorized();
            }

            accounts = accounts.filter(x => x.id !== idFromUrl());
            localStorage.setItem(accountsKey, JSON.stringify(accounts));
            return ok();
        }

        // Analytics functions
        function getUserStats() {
            if (!isAuthorized(Role.Admin)) return unauthorized();
            
            // Get monthly registration data (simulated)
            const monthlyData = generateMonthlyData();
            
            // Get user statistics
            const totalUsers = accounts.length;
            const activeUsers = accounts.filter(x => x.status === 'Active').length;
            const verifiedUsers = accounts.filter(x => x.isVerified).length;
            const onlineUsers = accounts.filter(x => x.isOnline).length;
            const refreshTokenCount = accounts.reduce((count, account) => 
                count + (account.refreshTokens ? account.refreshTokens.length : 0), 0);
            
            return ok({
                totalUsers,
                activeUsers,
                verifiedUsers,
                onlineUsers,
                refreshTokenCount,
                monthlyData
            });
        }

        function getOnlineUsers() {
            if (!isAuthorized(Role.Admin)) return unauthorized();
            
            // Update random online statuses for simulation
            updateOnlineStatuses();
            
            // Return all users with their online status
            return ok(accounts.map(x => ({
                ...basicDetails(x),
                isOnline: x.isOnline,
                lastActive: x.lastActive
            })));
        }

        function updateOnlineStatuses() {
            // Update online status based on last active time
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
            
            accounts = accounts.map(account => {
                const lastActive = account.lastActive ? new Date(account.lastActive) : null;
                account.isOnline = lastActive && lastActive > fiveMinutesAgo;
                return account;
            });
            
            localStorage.setItem(accountsKey, JSON.stringify(accounts));
        }

        function generateMonthlyData() {
            // Get all months in the current year
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const currentMonth = new Date().getMonth();
            
            // Initialize monthly counts
            const monthlyCounts = months.map(month => ({
                month,
                count: 0,
                isCurrent: false
            }));
            
            // Count registrations by month
            accounts.forEach(account => {
                if (account.dateCreated) {
                    const createdDate = new Date(account.dateCreated);
                    const monthIndex = createdDate.getMonth();
                    monthlyCounts[monthIndex].count++;
                }
            });
            
            // Mark current month
            monthlyCounts[currentMonth].isCurrent = true;
            
            return monthlyCounts;
        }
    }
}

export const fakeBackendProvider = {
    // use fake backend in place of Http service for backend-less development
    provide: HTTP_INTERCEPTORS,
    useClass: FakeBackendInterceptor,
    multi: true
};
