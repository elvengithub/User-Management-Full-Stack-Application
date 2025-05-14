const express = require('express');
const router = express.Router();
const db = require('../_helpers/db');
const authorize = require('../_middleware/authorize');
const Role = require('../_helpers/role');

router.post('/', authorize(), create);
router.get('/', authorize(Role.Admin), getAll);
router.get('/:id', authorize(), getById);
router.get('/employee/:employeeId', authorize(), getByEmployeeId);
router.put('/:id', authorize(Role.Admin), update);
router.put('/:id/status', authorize(Role.Admin), updateStatus);
router.delete('/:id', authorize(Role.Admin), _delete);

async function create(req, res, next) {
    try {
        console.log('Creating a new request with body:', JSON.stringify(req.body));
        
        // Ensure employeeId is properly set
        if (!req.body.employeeId && req.user) {
            // Get the employee ID from the account
            const account = await db.Account.findByPk(req.user.id);
            if (account) {
                // Find the employee linked to this account
                const employee = await db.Employee.findOne({
                    where: { accountId: account.id }
                });
                
                if (employee) {
                    req.body.employeeId = employee.id;
                } else {
                    throw new Error('No employee record found for this account');
                }
            }
        }
        
        // Create the request without items initially
        const request = await db.Request.create({
            employeeId: req.body.employeeId || req.user.employeeId,
            type: req.body.type || 'General Request',
            status: 'Pending', // Always set to Pending initially
            description: req.body.description || '' // Store description if provided
        });
        
        console.log(`Created request with ID: ${request.id}, type: ${request.type}`);
        
        let items = [];
        
        // Process and create request items if they exist
        if (req.body.items && Array.isArray(req.body.items) && req.body.items.length > 0) {
            console.log(`Processing ${req.body.items.length} items for request ID: ${request.id}`);
            
            // Map items and add the requestId
            const requestItems = req.body.items.map(item => ({
                requestId: request.id,
                name: item.name || 'Unnamed Item',
                quantity: item.quantity || 1,
                status: 'Pending' // Always set to Pending initially
            }));
            
            // Create all items in the database
            items = await db.RequestItem.bulkCreate(requestItems);
            
            // Format items for the response and workflow
            items = items.map(item => item.toJSON());
            console.log(`Created ${items.length} request items for request ID: ${request.id}`);
        } else {
            console.log(`No items provided for request ID: ${request.id}`);
        }
        
        // Format items for the workflow with better formatting
        const itemsList = items.map(item => `${item.name} (x${item.quantity})`);
        const itemsDetail = items.length > 0 ? 
            `${items.length} item(s): ${itemsList.join(', ')}` : 
            'No items requested';
            
        console.log(`Creating workflow for request ID: ${request.id} with ${items.length} items`);
        
        // Create workflow for request creation ONLY
        const workflowDetails = {
            requestId: request.id,
            requestType: request.type,
            itemCount: items.length,
            requestItems: items,
            items: itemsList,
            description: req.body.description || '',
            message: `New ${request.type} request created with ${items.length} item(s)`,
            requestStatus: 'Pending'
        };
        
        console.log('Workflow details:', JSON.stringify(workflowDetails));
        
        await db.Workflow.create({
            employeeId: request.employeeId,
            type: 'Request Created',
            status: 'Completed',
            details: workflowDetails
        });
        
        // Return the request with items
        const fullRequest = {
            ...request.toJSON(),
            items: items
        };
        
        res.status(201).json(fullRequest);
    } catch (err) { 
        console.error('Error creating request:', err);
        next(err); 
    }
}

async function getAll(req, res, next) {
    try {
        const requests = await db.Request.findAll({
            include: [{ model: db.RequestItem }]
        });
        
        // Get details for all requests
        const requestsWithDetails = await Promise.all(requests.map(async (req) => {
            const reqJson = req.toJSON();
            
            // Get employee information
            const employee = await db.Employee.findByPk(req.employeeId);
            
            // Ensure RequestItems is always an array
            if (!reqJson.RequestItems) {
                reqJson.RequestItems = [];
            }
            
            return {
                ...reqJson,
                employee: employee ? employee.toJSON() : null
            };
        }));
        
        res.json(requestsWithDetails);
    } catch (err) { next(err); }
}

async function getById(req, res, next) {
    try {
        const request = await db.Request.findByPk(req.params.id, {
            include: [{ model: db.RequestItem }]
        });
        
        if (!request) throw new Error('Request not found');
        
        // Check if user is admin or the request belongs to the user
        if (req.user.role !== Role.Admin && request.employeeId !== req.user.employeeId) {
            throw new Error('Unauthorized');
        }
        
        // Get employee information
        const employee = await db.Employee.findByPk(request.employeeId);
        
        const requestJson = request.toJSON();
        
        // Ensure RequestItems is always an array
        if (!requestJson.RequestItems) {
            requestJson.RequestItems = [];
        }
        
        const fullRequest = {
            ...requestJson,
            employee: employee ? employee.toJSON() : null
        };
        
        res.json(fullRequest);
    } catch (err) { next(err); }
}

async function getByEmployeeId(req, res, next) {
    try {
        const requests = await db.Request.findAll({
            where: { employeeId: req.params.employeeId },
            include: [{ model: db.RequestItem }]
        });
        
        // Ensure RequestItems is always an array in each request
        const processedRequests = requests.map(req => {
            const reqJson = req.toJSON();
            if (!reqJson.RequestItems) {
                reqJson.RequestItems = [];
            }
            return reqJson;
        });
        
        res.json(processedRequests);
    } catch (err) { next(err); }
}

async function update(req, res, next) {
    try {
        const request = await db.Request.findByPk(req.params.id);
        if (!request) throw new Error('Request not found');
        
        console.log(`Updating request ID: ${req.params.id}`, JSON.stringify(req.body));
        
        // Store old status for comparison
        const oldStatus = request.status;
        
        // Update request (excluding items)
        await request.update({
            employeeId: req.body.employeeId,
            type: req.body.type,
            status: req.body.status
        });
        
        console.log(`Request status changed from '${oldStatus}' to '${request.status}'`);
        
        let items = [];
        
        // Update request items if provided
        if (req.body.items && Array.isArray(req.body.items)) {
            console.log(`Processing ${req.body.items.length} items for request update`);
            
            // Delete existing items
            await db.RequestItem.destroy({ where: { requestId: request.id }});
            
            // Create new items
            if (req.body.items.length > 0) {
                const requestItems = req.body.items.map(item => ({
                    requestId: request.id,
                    name: item.name || 'Unnamed Item',
                    quantity: item.quantity || 1,
                    status: item.status || 'Pending'
                }));
                
                items = await db.RequestItem.bulkCreate(requestItems);
                items = items.map(item => item.toJSON());
                console.log(`Created ${items.length} new request items`);
            }
        } else {
            // Fetch current items if not provided in the request
            const existingItems = await db.RequestItem.findAll({ 
                where: { requestId: request.id } 
            });
            items = existingItems.map(item => item.toJSON());
            console.log(`Using ${items.length} existing request items`);
        }
        
        // Format items for workflow with better formatting
        const itemsList = items.map(item => `${item.name} (x${item.quantity})`);
        const itemsDetail = items.length > 0 ? 
            `${items.length} item(s): ${itemsList.join(', ')}` : 
            'No items requested';
        
        // Create workflow entry if status changed
        if (req.body.status && oldStatus !== req.body.status) {
            console.log(`Creating status update workflow for request ID: ${request.id}`);
            
            const workflowDetails = {
                requestId: request.id,
                requestType: request.type || 'General Request',
                oldStatus: oldStatus,
                newStatus: req.body.status,
                updatedBy: req.user.role,
                itemCount: items.length,
                requestItems: items,
                items: itemsList,
                requestStatus: req.body.status,
                description: request.description || '',
                message: `Request #${request.id} status changed from ${oldStatus} to ${req.body.status}`
            };
            
            console.log('Status update workflow details:', JSON.stringify(workflowDetails));
            
            await db.Workflow.create({
                employeeId: request.employeeId,
                type: 'Request Status Update',
                status: 'Completed',
                details: workflowDetails
            });
        }
        
        // Return the updated request with items
        const fullRequest = {
            ...request.toJSON(),
            items: items
        };
        
        res.json(fullRequest);
    } catch (err) { 
        console.error('Error updating request:', err);
        next(err); 
    }
}

async function updateStatus(req, res, next) {
    try {
        const request = await db.Request.findByPk(req.params.id);
        if (!request) throw new Error('Request not found');
        
        console.log(`Updating request status ID: ${req.params.id} to ${req.body.status}`);
        
        // Store old status for comparison
        const oldStatus = request.status;
        const newStatus = req.body.status;
        
        // Update request status only
        await request.update({
            status: newStatus
        });
        
        console.log(`Request status changed from '${oldStatus}' to '${newStatus}'`);
        
        // Get current items
        const existingItems = await db.RequestItem.findAll({ 
            where: { requestId: request.id } 
        });
        const items = existingItems.map(item => item.toJSON());
        
        // Format items for workflow
        const itemsList = items.map(item => `${item.name} (x${item.quantity})`);
        
        // Create workflow entry for the status change
        const workflowDetails = {
            requestId: request.id,
            requestType: request.type || 'General Request',
            oldStatus: oldStatus,
            newStatus: newStatus,
            updatedBy: req.user.role,
            itemCount: items.length,
            requestItems: items,
            items: itemsList,
            requestStatus: newStatus,
            description: request.description || '',
            message: `Request #${request.id} status changed from ${oldStatus} to ${newStatus}`
        };
        
        console.log('Status update workflow details:', JSON.stringify(workflowDetails));
        
        await db.Workflow.create({
            employeeId: request.employeeId,
            type: 'Request Status Update',
            status: 'Completed', 
            details: workflowDetails
        });
        
        // Return the updated request with items
        const fullRequest = {
            ...request.toJSON(),
            items: items
        };
        
        res.json(fullRequest);
    } catch (err) { 
        console.error('Error updating request status:', err);
        next(err); 
    }
}

async function _delete(req, res, next) {
    try {
        const request = await db.Request.findByPk(req.params.id);
        if (!request) throw new Error('Request not found');
        
        await request.destroy();
        res.json({ message: 'Request deleted' });
    } catch (err) { next(err); }
}

module.exports = router; 