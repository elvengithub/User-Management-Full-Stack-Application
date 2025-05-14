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
                    attributes: ['id', 'firstName', 'lastName', 'departmentId']
                }
            ],
            order: [['created', 'DESC']]
        });

        // Process workflows to add department information
        const processedWorkflows = await Promise.all(workflows.map(async (workflow) => {
            const workflowJson = workflow.toJSON();
            
            // Add department info for transfer workflows
            if (workflowJson.type === 'Employee Transfer' || workflowJson.type === 'Transfer' || 
                workflowJson.type === 'Department Transfer') {
                
                // Check for department IDs in details
                const details = workflowJson.details || {};
                
                if (details.oldDepartmentId) {
                    const oldDept = await db.Department.findByPk(details.oldDepartmentId);
                    if (oldDept) {
                        details.oldDepartmentName = oldDept.name;
                    }
                }
                
                if (details.newDepartmentId) {
                    const newDept = await db.Department.findByPk(details.newDepartmentId);
                    if (newDept) {
                        details.newDepartmentName = newDept.name;
                    }
                }
                
                // Update the details
                workflowJson.details = details;
            }
            
            // If the employee has a departmentId, fetch that department
            if (workflowJson.employee && workflowJson.employee.departmentId) {
                const dept = await db.Department.findByPk(workflowJson.employee.departmentId);
                if (dept) {
                    workflowJson.employee.department = dept.toJSON();
                }
            }
            
            return workflowJson;
        }));
        
        res.json(processedWorkflows);
    } catch (err) {
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
                    attributes: ['id', 'firstName', 'lastName', 'departmentId']
                }
            ],
            order: [['created', 'DESC']]
        });
        
        // Process workflows to add department information
        const processedWorkflows = await Promise.all(workflows.map(async (workflow) => {
            const workflowJson = workflow.toJSON();
            
            // Add department info for transfer workflows
            if (workflowJson.type === 'Employee Transfer' || workflowJson.type === 'Transfer' || 
                workflowJson.type === 'Department Transfer') {
                
                // Check for department IDs in details
                const details = workflowJson.details || {};
                
                if (details.oldDepartmentId) {
                    const oldDept = await db.Department.findByPk(details.oldDepartmentId);
                    if (oldDept) {
                        details.oldDepartmentName = oldDept.name;
                    }
                }
                
                if (details.newDepartmentId) {
                    const newDept = await db.Department.findByPk(details.newDepartmentId);
                    if (newDept) {
                        details.newDepartmentName = newDept.name;
                    }
                }
                
                // Update the details
                workflowJson.details = details;
            }
            
            // If the employee has a departmentId, fetch that department
            if (workflowJson.employee && workflowJson.employee.departmentId) {
                const dept = await db.Department.findByPk(workflowJson.employee.departmentId);
                if (dept) {
                    workflowJson.employee.department = dept.toJSON();
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
                    attributes: ['id', 'firstName', 'lastName', 'departmentId']
                }
            ]
        });
        
        if (!workflow) {
            return res.status(404).json({ message: 'Workflow not found' });
        }
        
        const workflowJson = workflow.toJSON();
        
        // Add department info for transfer workflows
        if (workflowJson.type === 'Employee Transfer' || workflowJson.type === 'Transfer' || 
            workflowJson.type === 'Department Transfer') {
            
            // Check for department IDs in details
            const details = workflowJson.details || {};
            
            if (details.oldDepartmentId) {
                const oldDept = await db.Department.findByPk(details.oldDepartmentId);
                if (oldDept) {
                    details.oldDepartmentName = oldDept.name;
                }
            }
            
            if (details.newDepartmentId) {
                const newDept = await db.Department.findByPk(details.newDepartmentId);
                if (newDept) {
                    details.newDepartmentName = newDept.name;
                }
            }
            
            // Update the details
            workflowJson.details = details;
        }
        
        // If the employee has a departmentId, fetch that department
        if (workflowJson.employee && workflowJson.employee.departmentId) {
            const dept = await db.Department.findByPk(workflowJson.employee.departmentId);
            if (dept) {
                workflowJson.employee.department = dept.toJSON();
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
        
        const newStatus = req.body.status;
        const oldStatus = workflow.status;
        const workflowType = workflow.type;
        
        // Process transfer workflows specially when status changes to Approved
        if ((workflowType === 'Employee Transfer' || workflowType === 'Transfer' || workflowType === 'Department Transfer') && 
            newStatus === 'Approved' && oldStatus !== 'Approved') {
            
            const details = workflow.details || {};
            const newDepartmentId = details.newDepartmentId;
            
            if (newDepartmentId && workflow.employee) {
                // Get the new department
                const newDepartment = await db.Department.findByPk(newDepartmentId);
                if (!newDepartment) {
                    return res.status(400).json({ message: 'Target department not found' });
                }
                
                // Update the employee's department
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
                
                // Add department info for the response
                const workflowJson = updatedWorkflow.toJSON();
                
                if (workflowJson.employee && workflowJson.employee.departmentId) {
                    const dept = await db.Department.findByPk(workflowJson.employee.departmentId);
                    if (dept) {
                        workflowJson.employee.department = dept.toJSON();
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
                
                return res.json(workflowJson);
            }
        } 
        // Reject transfer workflows
        else if ((workflowType === 'Employee Transfer' || workflowType === 'Transfer' || workflowType === 'Department Transfer') && 
                 newStatus === 'Rejected' && oldStatus !== 'Rejected') {
            
            // Just update status, no department change
            await workflow.update({ status: newStatus });
            return res.json(workflow);
        }
        // For any other status change or workflow type
        else {
            await workflow.update({ status: newStatus });
            return res.json(workflow);
        }
    } catch (err) {
        next(err);
    }
} 