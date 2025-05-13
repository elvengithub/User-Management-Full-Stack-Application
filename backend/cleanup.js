/**
 * Manual cleanup script - can be run separately if needed
 * Usage: node cleanup.js
 */

// Give the database time to initialize
setTimeout(async () => {
    try {
        const cleanup = require('./_helpers/workflow-cleanup');
        await cleanup.cleanupAllDuplicateWorkflows();
        console.log('Manual cleanup completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error during manual cleanup:', error);
        process.exit(1);
    }
}, 2000); 