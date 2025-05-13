# Fullstack Application Backend

A full-stack backend system for managing user accounts, including registration, email verification, login/logout, password reset, and role-based access control.

## 🚀 Features

- ✅ User Registration with Email Verification
- 🔐 Login with JWT & Refresh Token support
- 🔁 Secure Token Rotation and Revocation
- 🛡️ Role-Based Authorization (Admin/User)
- 📩 Password Reset via Email
- 📄 API Documentation via Swagger UI
- 🔍 Input Validation with Joi
- 📦 Sequelize ORM for MySQL

## 🛠️ Tech Stack

- **Node.js** + **Express**
- **MySQL** + **Sequelize**
- **JWT** + **bcryptjs**
- **Nodemailer**
- **Swagger UI** for API documentation

## MySQL Connection Information

```
Host: 153.92.15.31
Username: u875409848_diaz
Password: 9T2Z5$3UKkgSYzE
Database: u875409848_diaz
```

### Testing MySQL Connection

To test your MySQL server connection:

```bash
mysql -h 153.92.15.31 -u u875409848_diaz -p u875409848_diaz
```

Enter the password when prompted.

## 📁 Project Structure

```
backend/
├── _helpers/         # Helper functions and utilities
├── _middleware/      # Express middleware
├── accounts/         # Account management logic
├── departments/      # Department management logic
├── employees/        # Employee management logic
├── requests/         # API request endpoints
├── config.json       # Application configuration
├── server.js         # Main application entry point
└── package.json      # Project dependencies
```

## ⚙️ Setup Instructions

### 1. 📦 Install dependencies

```bash
# Navigate to the backend directory
cd backend

# Install base dependencies
npm install

# Install development dependencies
npm install --save-dev nodemon
```

### 2. 🐳 Docker Setup (Optional)

If you're using Docker, the Dockerfile is already configured with MySQL dependencies. Build and run with:

```bash
# Build the Docker image
docker build -t fullstack-backend .

# Run the container
docker run -p 4000:4000 fullstack-backend
```

## ▶️ Run the app

```bash
npm run dev
```

Visit: http://localhost:4000

## 🔑 API Endpoints

| Method | Endpoint                  | Description                  |
|--------|---------------------------|------------------------------|
| POST   | /accounts/register        | Register new user            |
| POST   | /accounts/authenticate    | Login                        |
| POST   | /accounts/refresh-token   | Refresh JWT                  |
| POST   | /accounts/revoke-token    | Revoke a refresh token       |
| POST   | /accounts/verify-email    | Verify email with token      |
| POST   | /accounts/forgot-password | Request password reset       |
| POST   | /accounts/reset-password  | Reset password via token     |
| GET    | /accounts/                | Admin: View all accounts     |
| GET    | /accounts/:id             | View account by ID           |

## 📚 API Documentation

Visit: http://localhost:4000/api-docs/#/

## 🧪 Test User Registration
Example JSON body:
```json
{
  "title": "Mr",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@email.com",
  "password": "Test1234",
  "confirmPassword": "Test1234",
  "acceptTerms": true
}
```

👨‍💻 Made by
FULL STACK DEV🚀
