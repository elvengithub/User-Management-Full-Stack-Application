# User Management Application - Frontend

## Overview

This is a full-stack user management application built with Angular. The frontend provides a comprehensive UI for managing users, employees, departments, workflows, and requests. It features role-based access control, where admins have full access while regular users have limited permissions.

## Features

- User authentication (login, register, verify email, reset password)
- Role-based access control (Admin vs. User roles)
- Employee management
- Department management
- Workflow tracking and approval
- Request management system
- User statistics and analytics

## Routes Structure

### Authentication Routes

- `/account/login` - Login page
- `/account/register` - Registration page
- `/account/verify-email` - Email verification
- `/account/forgot-password` - Password recovery
- `/account/reset-password` - Password reset
- `/account/profile` - User profile management

### Admin Routes (Admin role only)

- `/admin` - Admin dashboard
- `/admin/accounts` - Manage all user accounts
- `/admin/accounts/add` - Add new user account
- `/admin/accounts/:id` - Edit user account
- `/admin/analytics` - View user statistics and analytics

### Employee Routes

- `/employees` - List all employees
- `/employees/add` - Add new employee (Admin only)
- `/employees/:id` - View employee details
- `/employees/:id/edit` - Edit employee information (Admin only)
- `/employees/:id/transfer` - Transfer employee to a different department (Admin only)

### Department Routes

- `/departments` - List all departments
- `/departments/add` - Add new department (Admin only)
- `/departments/:id` - View department details
- `/departments/:id/edit` - Edit department information (Admin only)

### Workflow Routes

- `/workflows` - List all workflows
- `/workflows/:id` - View workflow details
- `/workflows/employee/:id` - View workflows for a specific employee

### Request Routes

- `/requests` - List all requests (Admin view) or own requests (User view)
- `/requests/add` - Create new request
- `/requests/:id` - View request details
- `/requests/:id/edit` - Edit request (Admin only)

## API Communication

The frontend communicates with the backend API through services:

- `AccountService` - Handles authentication and account management
- `EmployeeService` - Manages employee data
- `DepartmentService` - Manages department data
- `WorkflowService` - Handles workflow operations
- `RequestService` - Manages request operations
- `AlertService` - Provides application-wide alerts and notifications

## Fake Backend

The application includes a fake backend interceptor for testing without a real API server:

- Set `useFakeBackend: true` in `environment.ts` to use the fake backend
- The fake backend simulates all API endpoints and data persistence using LocalStorage
- Perfect for development and testing without a backend server

## Key Components

- `AlertComponent` - Displays application notifications
- `JwtInterceptor` - Adds authentication headers to outgoing requests
- `ErrorInterceptor` - Handles API errors globally
- `AuthGuard` - Protects routes based on authentication and role requirements

## Development

1. Run `npm install` to install dependencies
2. Run `ng serve` to start the development server
3. Navigate to `http://localhost:4200/`

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Testing

Run `ng test` to execute the unit tests via Karma.
