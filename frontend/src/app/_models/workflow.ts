export interface Workflow {
    id?: string;
    type: string;
    employeeId: string;
    employee?: any;
    details: any;
    status: string;
    created?: Date;
    updated?: Date;
} 