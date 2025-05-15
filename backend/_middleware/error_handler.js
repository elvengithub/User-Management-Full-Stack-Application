module.exports = errorHandler;

function errorHandler(err, req, res, next) {
    // Log the error in a structured way
    console.error('=== ERROR HANDLER START ===');
    console.error(`Request URL: ${req.method} ${req.originalUrl}`);
    console.error(`Error type: ${typeof err}`);
    
    if (typeof err === 'object') {
        console.error(`Error name: ${err.name}`);
        console.error(`Error message: ${err.message}`);
        
        // Log stack trace in development
        if (process.env.NODE_ENV !== 'production') {
            console.error('Stack trace:');
            console.error(err.stack);
        }
        
        // Log SQL error details if available
        if (err.original && err.original.sqlMessage) {
            console.error(`SQL error: ${err.original.sqlMessage}`);
        }
    } else {
        console.error(`Raw error: ${err}`);
    }
    console.error('=== ERROR HANDLER END ===');
    
    // Determine appropriate error response
    switch (true) {
        case typeof err === 'string':
            // custom application error
            const is404 = err.toLowerCase().endsWith('not found');
            const isEmailError = err.toLowerCase().includes('email') && err.toLowerCase().includes('already registered');
            const statusCode = is404 ? 404 : (isEmailError ? 409 : 400);
            return res.status(statusCode).json({ message: err });
        
        case err.name === 'UnauthorizedError':
            // jwt authentication error
            return res.status(401).json({ message: 'Unauthorized' });
        
        case err.name === 'SequelizeUniqueConstraintError':
            // Database unique constraint error (like duplicate email)
            const fieldName = err.errors && err.errors[0] ? err.errors[0].path : 'field';
            return res.status(409).json({ 
                message: `A record with the same ${fieldName} already exists`,
                field: fieldName
            });
            
        case err.name === 'SequelizeForeignKeyConstraintError':
            // Foreign key constraint error
            return res.status(400).json({ 
                message: 'Cannot delete or update because other records depend on this record',
                details: err.message
            });
            
        case err.name === 'SequelizeValidationError':
            // Validation error
            const validationErrors = err.errors.map(e => ({ 
                field: e.path, 
                message: e.message 
            }));
            return res.status(400).json({ 
                message: 'Validation error',
                errors: validationErrors
            });
            
        default:
            // Return simplified error in production, more details in development
            const responseBody = {
                message: 'Internal server error',
                error: process.env.NODE_ENV !== 'production' ? err.message : undefined
            };
            return res.status(500).json(responseBody);
    }
}