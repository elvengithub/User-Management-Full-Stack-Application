# User Management System

## Overview

This is a comprehensive User Management System built with a modern tech stack. The application provides a complete solution for managing users, employees, departments, workflows, and requests. It features a responsive frontend with dark mode UI and a secure, scalable backend API.

## Project Structure

The project is organized into two main components:

- **`/frontend`** - Angular 15 application
- **`/backend`** - Node.js RESTful API

## Technology Stack

### Frontend
- Angular 15.2.0
- RxJS 7.8.2
- Socket.IO Client
- TypeScript 4.9.5
- Bootstrap (with dark mode theming)

### Backend
- Node.js with Express
- MySQL/PostgreSQL with Sequelize ORM
- JWT Authentication
- Swagger API Documentation

## Features

- **User Authentication**
  - Login/Register
  - Email verification
  - Password reset
  - JWT with refresh token mechanism
  - Role-based access control

- **Employee Management**
  - Employee profiles
  - Department assignment
  - Transfer workflows

- **Department Management**
  - Create/edit departments
  - Assign employees to departments
  - Track department statistics

- **Request System**
  - Equipment requests
  - Resource allocation
  - Approval workflows

- **Workflow Management**
  - Status tracking
  - Approval processes
  - Activity logging

- **Admin Dashboard**
  - User statistics
  - System overview
  - Administrative controls

- **Modern UI**
  - Dark mode support
  - Responsive design
  - Intuitive navigation

## Getting Started

### Prerequisites
- Node.js (v14 or later)
- MySQL or PostgreSQL database
- NPM or Yarn

### Setting Up the Backend
1. Navigate to the backend directory:
   ```
   cd backend
   ```
2. Install dependencies:
   ```
   npm install
   ```
3. Configure your database in `config.json`
4. Start the server:
   ```
   npm start
   ```
   
The backend API will be available at http://localhost:4000 and Swagger documentation at http://localhost:4000/api-docs

### Setting Up the Frontend
1. Navigate to the frontend directory:
   ```
   cd frontend
   ```
2. Install dependencies:
   ```
   npm install
   ```
3. Start the development server:
   ```
   npm start
   ```

The frontend application will be available at http://localhost:4200

## Development

For backend development with auto-reload:
```
cd backend
npm run dev
```

For frontend development:
```
cd frontend
npm start
```

## Deployment

The project includes Docker support for containerized deployment. For production deployment, set the appropriate environment variables in the backend's `.env` file or through your deployment platform.
