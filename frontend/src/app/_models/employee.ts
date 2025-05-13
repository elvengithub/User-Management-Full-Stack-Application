import { Department } from './department';

export interface Employee {
    id?: string;
    employeeId: string;
    userId: string;
    position: string;
    departmentId: string;
    department?: Department;
    hireDate: Date | string;
    status: string;
    user?: any; // Reference to the user account
} 