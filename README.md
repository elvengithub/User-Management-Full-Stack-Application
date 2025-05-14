# User Management Full Stack Application

A comprehensive application for managing users, employees, departments, workflows, and requests with role-based access control.

## Overview

This full-stack application consists of:
- Angular frontend with role-based access control
- Node.js backend with Express serving a RESTful API
- MySQL database integration using Sequelize ORM

## Features

- **Authentication and Authorization**
  - JWT-based authentication with refresh tokens
  - Role-based access control (Admin and User roles)
  - Email verification and password reset functionality

- **User & Employee Management**
  - User account management (register, verify, update, delete)
  - Employee management with department assignments
  - Department creation and management

- **Workflow Management**
  - Track employee-related workflows (onboarding, transfers, etc.)
  - Approval system for workflows
  - Status tracking and history

- **Request System**
  - Equipment request creation and approval
  - Request status tracking
  - Request history and management

## Project Structure

```
/
├── frontend/           # Angular frontend application
│   ├── src/            # Source files
│   │   ├── app/        # Application components and modules
│   │   └── ...
│   └── ...
├── backend/            # Node.js backend application
│   ├── accounts/       # Account management routes and controllers
│   ├── employees/      # Employee management
│   ├── departments/    # Department management
│   ├── workflows/      # Workflow management
│   ├── requests/       # Request management
│   └── ...
└── ...
```

## Role-Based Access

### Admin Role
- Full access to all application features
- User account management
- Employee management (add, edit, delete)
- Department management
- Request approval
- Workflow management
- System analytics

### User Role
- View employees and departments
- Create and track personal requests
- View personal workflows
- Update personal profile

## Fake Backend

For development and testing, the application includes a fake backend that simulates API endpoints using browser's localStorage.

- Set `useFakeBackend: true` in `frontend/src/environments/environment.ts`
- All API calls will be intercepted and handled by the fake backend
- Perfect for development without a running backend server

## Getting Started

### Frontend

```bash
cd frontend
npm install
ng serve
```

The frontend application will be available at http://localhost:4200

### Backend

```bash
cd backend
npm install
npm run dev
```

The backend API will be available at http://localhost:4000

## API Documentation

API documentation is available through Swagger UI at http://localhost:4000/api-docs

## Testing

### Running Unit Tests

```bash
# Frontend tests
cd frontend
ng test

# Backend tests
cd backend
npm test
```

## License

MIT 