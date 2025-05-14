const express = require('express');
const router = express.Router();
const db = require('../_helpers/db');
const authorize = require('../_middleware/authorize');

// Routes
router.get('/', authorize(), getAll);
router.get('/employee/:employeeId', authorize(), getByEmployee);
router.get('/:id', authorize(), getById);
router.post('/', authorize(), create);
router.put('/:id/status', authorize(), updateStatus);

module.exports = router;

// Controller functions

async function getAll(req, res, next) {
    try {
        // Get all workflows with employee data
        const workflows = await db.Workflow.findAll({
            include: [
                { 
                    model: db.Employee,
                    attributes: ['id', 'firstName', 'lastName', 'departmentId', 'employeeId']
                }
            ],
            order: [['created', 'DESC']]
        });

        console.log(`Found ${workflows.length} workflows to process`);

        // Get all departments to use for lookup
        const departments = await db.Department.findAll();
        const departmentMap = new Map();
        departments.forEach(dept => {
            departmentMap.set(dept.id, dept.toJSON());
        });
        
        console.log(`Found ${departments.length} departments for reference`);

        // Process workflows to add department information
        const processedWorkflows = await Promise.all(workflows.map(async (workflow) => {
            const workflowJson = workflow.toJSON();
            
            // Add department info for transfer workflows
            if (workflowJson.type === 'Employee Transfer' || workflowJson.type === 'Transfer' || 
                workflowJson.type === 'Department Transfer') {
                
                // Parse details if it's a string
                let details = workflowJson.details;
                if (typeof details === 'string') {
                    try {
                        details = JSON.parse(details);
                        workflowJson.details = details;
                    } catch (e) {
                        console.error('Error parsing workflow details:', e);
                    }
                }
                
                if (details) {
                    // Check for department IDs in details
                    const oldDepId = details.oldDepartmentId ? parseInt(details.oldDepartmentId) : null;
                    const newDepId = details.newDepartmentId ? parseInt(details.newDepartmentId) : 
                                     details.departmentId ? parseInt(details.departmentId) : null;
                    
                    if (oldDepId) {
                        const oldDept = departmentMap.get(oldDepId);
                        if (oldDept) {
                            details.oldDepartmentName = oldDept.name;
                            details.fromDepartment = oldDept.name;
                            details.from = oldDept.name;
                            details.fromDepartmentName = oldDept.name;
                            details.sourceDepartment = oldDept.name;
                        }
                    }
                    
                    if (newDepId) {
                        const newDept = departmentMap.get(newDepId);
                        if (newDept) {
                            details.newDepartmentName = newDept.name;
                            details.toDepartment = newDept.name;
                            details.to = newDept.name;
                            details.toDepartmentName = newDept.name;
                            details.targetDepartment = newDept.name;
                        }
                    }
                    
                    // Update the details in the workflow json
                    workflowJson.details = details;
                }
            }
            
            // Handle Request Created or Request Status Update workflows to include detailed item information
            if ((workflowJson.type === 'Request Created' || workflowJson.type === 'Request Status Update') && 
                workflowJson.details) {
                try {
                    // Parse details if it's a string
                    let details = workflowJson.details;
                    if (typeof details === 'string') {
                        try {
                            details = JSON.parse(details);
                            console.log('Parsed workflow details from string');
                        } catch (e) {
                            console.error('Error parsing workflow details from string:', e);
                        }
                    }
                    
                    // Always initialize arrays to prevent null issues
                    details.requestItems = details.requestItems || [];
                    details.items = details.items || [];
                    
                    // Only fetch request details if requestId exists and arrays are empty
                    if (details.requestId && 
                        (details.requestItems.length === 0 || details.items.length === 0)) {
                        const requestId = details.requestId;
                        console.log(`Processing request related workflow ID: ${workflowJson.id}, type: ${workflowJson.type}, requestId: ${requestId}`);
                        
                        // Get the original request with its items
                        console.log(`Looking up request ID: ${requestId} to get items`);
                        const request = await db.Request.findByPk(requestId, {
                            include: [{ model: db.RequestItem }]
                        });
                        
                        if (request) {
                            console.log(`Found request with ID: ${requestId}, type: ${request.type}, with ${request.RequestItems ? request.RequestItems.length : 0} items`);
                            
                            // Add request data to the workflow details
                            details.requestItems = request.RequestItems ? request.RequestItems.map(item => item.toJSON()) : [];
                            details.itemCount = details.requestItems.length;
                            details.requestType = request.type || 'General Request';
                            details.requestStatus = request.status || 'Pending';
                            
                            // Format items for display
                            details.items = details.requestItems.map(item => `${item.name} (x${item.quantity})`);
                            
                            console.log(`Added ${details.requestItems.length} items to workflow details`);
                        } else {
                            console.warn(`Request ID: ${requestId} not found`);
                        }
                    }
                    
                    workflowJson.details = details;
                } catch (error) {
                    console.error('Error processing request details for workflow:', error);
                }
            }
            
            // If the employee has a departmentId, fetch that department from our map
            if (workflowJson.employee && workflowJson.employee.departmentId) {
                const dept = departmentMap.get(workflowJson.employee.departmentId);
                if (dept) {
                    workflowJson.employee.department = dept;
                }
            }
            
            return workflowJson;
        }));
        
        console.log(`Returning ${processedWorkflows.length} processed workflows`);
        res.json(processedWorkflows);
    } catch (err) {
        console.error('Error getting all workflows:', err);
        next(err);
    }
}

async function getByEmployee(req, res, next) {
    try {
        const employeeId = req.params.employeeId;
        
        // Get all workflows for this employee
        const workflows = await db.Workflow.findAll({
            where: { employeeId },
            include: [
                { 
                    model: db.Employee,
                    attributes: ['id', 'firstName', 'lastName', 'departmentId', 'employeeId']
                }
            ],
            order: [['created', 'DESC']]
        });
        
        // Get all departments to use for lookup
        const departments = await db.Department.findAll();
        const departmentMap = new Map();
        departments.forEach(dept => {
            departmentMap.set(dept.id, dept.toJSON());
        });
        
        // Process workflows to add department information
        const processedWorkflows = await Promise.all(workflows.map(async (workflow) => {
            const workflowJson = workflow.toJSON();
            
            // Add department info for transfer workflows
            if (workflowJson.type === 'Employee Transfer' || workflowJson.type === 'Transfer' || 
                workflowJson.type === 'Department Transfer') {
                
                // Parse details if it's a string
                let details = workflowJson.details;
                if (typeof details === 'string') {
                    try {
                        details = JSON.parse(details);
                        workflowJson.details = details;
                    } catch (e) {
                        console.error('Error parsing workflow details:', e);
                    }
                }
                
                if (details) {
                    // Check for department IDs in details
                    const oldDepId = details.oldDepartmentId ? parseInt(details.oldDepartmentId) : null;
                    const newDepId = details.newDepartmentId ? parseInt(details.newDepartmentId) : 
                                     details.departmentId ? parseInt(details.departmentId) : null;
                    
                    if (oldDepId) {
                        const oldDept = departmentMap.get(oldDepId);
                        if (oldDept) {
                            details.oldDepartmentName = oldDept.name;
                            details.fromDepartment = oldDept.name;
                            details.from = oldDept.name;
                            details.fromDepartmentName = oldDept.name;
                            details.sourceDepartment = oldDept.name;
                        }
                    }
                    
                    if (newDepId) {
                        const newDept = departmentMap.get(newDepId);
                        if (newDept) {
                            details.newDepartmentName = newDept.name;
                            details.toDepartment = newDept.name;
                            details.to = newDept.name;
                            details.toDepartmentName = newDept.name;
                            details.targetDepartment = newDept.name;
                        }
                    }
                    
                    // Update the details in the workflow json
                    workflowJson.details = details;
                }
            }
            
            // Handle Request Created or Request Status Update workflows to include detailed item information
            if ((workflowJson.type === 'Request Created' || workflowJson.type === 'Request Status Update') && 
                workflowJson.details) {
                try {
                    // Parse details if it's a string
                    let details = workflowJson.details;
                    if (typeof details === 'string') {
                        try {
                            details = JSON.parse(details);
                        } catch (e) {
                            console.error('Error parsing workflow details from string:', e);
                        }
                    }
                    
                    // Always initialize arrays to prevent null issues
                    details.requestItems = details.requestItems || [];
                    details.items = details.items || [];
                    
                    // Only fetch request details if requestId exists and arrays are empty
                    if (details.requestId && 
                        (details.requestItems.length === 0 || details.items.length === 0)) {
                        const requestId = details.requestId;
                        
                        // Get the original request with its items
                        const request = await db.Request.findByPk(requestId, {
                            include: [{ model: db.RequestItem }]
                        });
                        
                        if (request) {
                            // Add request data to the workflow details
                            details.requestItems = request.RequestItems ? request.RequestItems.map(item => item.toJSON()) : [];
                            details.itemCount = details.requestItems.length;
                            details.requestType = request.type || 'General Request';
                            details.requestStatus = request.status || 'Pending';
                            
                            // Format items for display
                            details.items = details.requestItems.map(item => `${item.name} (x${item.quantity})`);
                        }
                    }
                    
                    workflowJson.details = details;
                } catch (error) {
                    console.error('Error processing request details for workflow:', error);
                }
            }
            
            // If the employee has a departmentId, fetch that department from our map
            if (workflowJson.employee && workflowJson.employee.departmentId) {
                const dept = departmentMap.get(workflowJson.employee.departmentId);
                if (dept) {
                    workflowJson.employee.department = dept;
                }
            }
            
            return workflowJson;
        }));
        
        res.json(processedWorkflows);
    } catch (err) {
        next(err);
    }
}

async function getById(req, res, next) {
    try {
        const workflow = await db.Workflow.findByPk(req.params.id, {
            include: [
                { 
                    model: db.Employee,
                    attributes: ['id', 'firstName', 'lastName', 'departmentId', 'employeeId']
                }
            ]
        });
        
        if (!workflow) {
            return res.status(404).json({ message: 'Workflow not found' });
        }
        
        const workflowJson = workflow.toJSON();
        
        // Get departments for reference
        const departments = await db.Department.findAll();
        const departmentMap = new Map();
        departments.forEach(dept => {
            departmentMap.set(dept.id, dept.toJSON());
        });
        
        // Add department info for transfer workflows
        if (workflowJson.type === 'Employee Transfer' || workflowJson.type === 'Transfer' || 
            workflowJson.type === 'Department Transfer') {
            
            // Parse details if it's a string
            let details = workflowJson.details;
            if (typeof details === 'string') {
                try {
                    details = JSON.parse(details);
                    workflowJson.details = details;
                } catch (e) {
                    console.error('Error parsing workflow details:', e);
                }
            }
            
            if (details) {
                // Check for department IDs in details
                const oldDepId = details.oldDepartmentId ? parseInt(details.oldDepartmentId) : null;
                const newDepId = details.newDepartmentId ? parseInt(details.newDepartmentId) : 
                                 details.departmentId ? parseInt(details.departmentId) : null;
                
                if (oldDepId) {
                    const oldDept = departmentMap.get(oldDepId);
                    if (oldDept) {
                        details.oldDepartmentName = oldDept.name;
                        details.fromDepartment = oldDept.name;
                        details.from = oldDept.name;
                        details.fromDepartmentName = oldDept.name;
                        details.sourceDepartment = oldDept.name;
                    }
                }
                
                if (newDepId) {
                    const newDept = departmentMap.get(newDepId);
                    if (newDept) {
                        details.newDepartmentName = newDept.name;
                        details.toDepartment = newDept.name;
                        details.to = newDept.name;
                        details.toDepartmentName = newDept.name;
                        details.targetDepartment = newDept.name;
                    }
                }
                
                // Update the details in the workflow json
                workflowJson.details = details;
            }
        }
        
        // Handle Request Created or Request Status Update workflows to include detailed item information
        if ((workflowJson.type === 'Request Created' || workflowJson.type === 'Request Status Update') && 
            workflowJson.details) {
            try {
                // Parse details if it's a string
                let details = workflowJson.details;
                if (typeof details === 'string') {
                    try {
                        details = JSON.parse(details);
                    } catch (e) {
                        console.error('Error parsing workflow details from string:', e);
                    }
                }
                
                // Always initialize arrays to prevent null issues
                details.requestItems = details.requestItems || [];
                details.items = details.items || [];
                
                // Only fetch request details if requestId exists and arrays are empty
                if (details.requestId && 
                    (details.requestItems.length === 0 || details.items.length === 0)) {
                    const requestId = details.requestId;
                    
                    // Get the original request with its items
                    const request = await db.Request.findByPk(requestId, {
                        include: [{ model: db.RequestItem }]
                    });
                    
                    if (request) {
                        // Add request data to the workflow details
                        details.requestItems = request.RequestItems ? request.RequestItems.map(item => item.toJSON()) : [];
                        details.itemCount = details.requestItems.length;
                        details.requestType = request.type || 'General Request';
                        details.requestStatus = request.status || 'Pending';
                        
                        // Format items for display
                        details.items = details.requestItems.map(item => `${item.name} (x${item.quantity})`);
                    }
                }
                
                workflowJson.details = details;
            } catch (error) {
                console.error('Error processing request details for workflow:', error);
            }
        }
        
        // If the employee has a departmentId, add department info
        if (workflowJson.employee && workflowJson.employee.departmentId) {
            const dept = departmentMap.get(workflowJson.employee.departmentId);
            if (dept) {
                workflowJson.employee.department = dept;
            }
        }
        
        res.json(workflowJson);
    } catch (err) {
        next(err);
    }
}

async function create(req, res, next) {
    try {
        const workflow = await db.Workflow.create(req.body);
        res.status(201).json(workflow);
    } catch (err) {
        next(err);
    }
}

async function updateStatus(req, res, next) {
    try {
        console.log(`Workflow status update request received for ID: ${req.params.id}, new status: ${req.body.status}`);
        
        const workflow = await db.Workflow.findByPk(req.params.id, {
            include: [
                { 
                    model: db.Employee,
                    attributes: ['id', 'firstName', 'lastName', 'departmentId', 'employeeId']
                }
            ]
        });
        
        if (!workflow) {
            console.log(`Workflow not found with ID: ${req.params.id}`);
            return res.status(404).json({ message: 'Workflow not found' });
        }
        
        const newStatus = req.body.status;
        const oldStatus = workflow.status;
        const workflowType = workflow.type;
        
        console.log(`Processing workflow: Type=${workflowType}, Status change ${oldStatus} -> ${newStatus}`);
        console.log(`Workflow details:`, typeof workflow.details === 'string' ? workflow.details : JSON.stringify(workflow.details, null, 2));
        
        // Process transfer workflows specially when status changes to Approved
        if ((workflowType === 'Employee Transfer' || workflowType === 'Transfer' || workflowType === 'Department Transfer') && 
            newStatus === 'Approved' && oldStatus !== 'Approved') {
            
            console.log(`Processing transfer approval for workflow ${req.params.id}`);
            
            // Ensure we have valid details
            if (!workflow.details) {
                console.log(`No details found in workflow`);
                return res.status(400).json({ message: 'No details found in workflow' });
            }
            
            // Parse details if it's a string (can happen with Sequelize JSON fields)
            let details = workflow.details;
            if (typeof details === 'string') {
                try {
                    details = JSON.parse(details);
                    console.log('Parsed details from string:', details);
                } catch (e) {
                    console.error('Error parsing details from string:', e);
                }
            }
            
            console.log(`Raw workflow details:`, details);
            
            // Look for department ID in all possible properties, handling string values
            let newDepartmentId = null;
            
            // Check multiple fields in order of priority
            if (details.newDepartmentId !== undefined && details.newDepartmentId !== null)
                newDepartmentId = parseInt(details.newDepartmentId);
            else if (details.departmentId !== undefined && details.departmentId !== null)
                newDepartmentId = parseInt(details.departmentId);
            else if (details.targetDepartmentId !== undefined && details.targetDepartmentId !== null)
                newDepartmentId = parseInt(details.targetDepartmentId);
            else if (details.toDepartmentId !== undefined && details.toDepartmentId !== null)
                newDepartmentId = parseInt(details.toDepartmentId);
            
            console.log(`Extracted new department ID: ${newDepartmentId}`);
            
            if (isNaN(newDepartmentId) || newDepartmentId === null) {
                console.log(`Could not find valid new department ID in workflow details:`, details);
                return res.status(400).json({ 
                    message: 'Missing or invalid new department ID in workflow details',
                    details: details
                });
            }
            
            console.log(`Transfer details: NewDepartmentId=${newDepartmentId}, Employee=${workflow.employee?.id}`);
            
            if (newDepartmentId && workflow.employee) {
                // Get the new department
                const newDepartment = await db.Department.findByPk(newDepartmentId);
                if (!newDepartment) {
                    console.log(`Target department not found with ID: ${newDepartmentId}`);
                    return res.status(400).json({ message: 'Target department not found' });
                }
                
                // Update the employee's department
                console.log(`Updating employee ${workflow.employee.id} department to ${newDepartmentId}`);
                await workflow.employee.update({ departmentId: newDepartmentId });
                
                console.log(`Employee ${workflow.employee.id} transferred to department ${newDepartmentId} due to workflow approval`);
                
                // Update workflow status
                await workflow.update({ status: newStatus });
                
                // Get the updated workflow with fresh data
                const updatedWorkflow = await db.Workflow.findByPk(req.params.id, {
                    include: [
                        { 
                            model: db.Employee,
                            attributes: ['id', 'firstName', 'lastName', 'departmentId', 'employeeId']
                        }
                    ]
                });
                
                // Get all departments for reference
                const departments = await db.Department.findAll();
                const departmentMap = new Map();
                departments.forEach(dept => {
                    departmentMap.set(dept.id, dept.toJSON());
                });
                
                // Add department info for the response
                const workflowJson = updatedWorkflow.toJSON();
                
                if (workflowJson.employee && workflowJson.employee.departmentId) {
                    const dept = departmentMap.get(workflowJson.employee.departmentId);
                    if (dept) {
                        workflowJson.employee.department = dept;
                    }
                }
                
                // Update the details to reflect the changes
                if (workflowJson.details) {
                    if (newDepartment) {
                        workflowJson.details.newDepartmentName = newDepartment.name;
                        workflowJson.details.toDepartment = newDepartment.name;
                        workflowJson.details.to = newDepartment.name;
                    }
                }
                
                console.log('Transfer workflow approved and applied successfully');
                return res.json(workflowJson);
            } else {
                console.log('Missing required data for transfer: either newDepartmentId or employee');
                return res.status(400).json({ 
                    message: 'Missing required data for transfer',
                    details: {
                        hasNewDepartmentId: !!newDepartmentId,
                        hasEmployee: !!workflow.employee,
                        workflowDetails: details
                    }
                });
            }
        } 
        // Reject transfer workflows
        else if ((workflowType === 'Employee Transfer' || workflowType === 'Transfer' || workflowType === 'Department Transfer') && 
                 newStatus === 'Rejected' && oldStatus !== 'Rejected') {
            
            console.log(`Rejecting transfer workflow ${req.params.id}`);
            // Just update status, no department change
            await workflow.update({ status: newStatus });
            return res.json(workflow);
        }
        // For any other status change or workflow type
        else {
            console.log(`Standard status update for workflow ${req.params.id}`);
            await workflow.update({ status: newStatus });
            return res.json(workflow);
        }
    } catch (err) {
        console.error('Error during workflow status update:', err);
        next(err);
    }
} 