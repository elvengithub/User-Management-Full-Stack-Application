export interface Request {
    id?: string;
    type: string;
    employeeId: string;
    employee?: any;
    requestItems: RequestItem[];
    status: string;
    created?: Date;
    updated?: Date;
}

export interface RequestItem {
    id?: string;
    name: string;
    quantity: number;
} 