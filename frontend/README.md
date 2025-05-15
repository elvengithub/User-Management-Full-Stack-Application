# User Management System - Frontend

## Overview

This is the frontend application for a comprehensive User Management System built with Angular 15. This application provides a modern UI with dark mode for managing users, employees, departments, workflows, and requests. The system features role-based access control, allowing administrators to have full system access while regular users have limited permissions.

## Technology Stack

- **Angular:** v15.2.0
- **RxJS:** v7.8.2
- **Socket.IO Client:** v4.8.1
- **TypeScript:** v4.9.5

## Features

- User authentication (login, register, verify email, reset password)
- Role-based access control (Admin vs. User roles)
- Employee management
- Department management
- Workflow tracking and approval
- Request management system
- User statistics and analytics
- Dark mode UI

## Application Structure

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
- `/admin/employees` - Manage employees
- `/admin/departments` - Manage departments
- `/admin/requests` - Manage requests
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

## Core Services

- `AccountService` - Handles authentication and account management
- `EmployeeService` - Manages employee data
- `DepartmentService` - Manages department data
- `WorkflowService` - Handles workflow operations
- `RequestService` - Manages request operations
- `AlertService` - Provides application-wide alerts and notifications

## Development Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Start the development server:
   ```
   npm start
   ```

3. Navigate to `http://localhost:4200/`

## Build

Run `npm run build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Testing

Run `npm test` to execute the unit tests via Karma.

## Proxy Configuration

The application is configured to proxy API requests to the backend server through `proxy.conf.json`.

## Additional Commands

- `npm run clean` - Clean the project by removing dist and node_modules, then reinstalling dependencies
- `npm run prettify` - Format code using Prettier
