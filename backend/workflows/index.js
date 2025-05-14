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
        const workflow = await db.Workflow.findByPk(req.params.id);
        if (!workflow) {
            return res.status(404).json({ message: 'Workflow not found' });
        }
        
        await workflow.update({ status: req.body.status });
        res.json(workflow);
    } catch (err) {
        next(err);
    }
} 