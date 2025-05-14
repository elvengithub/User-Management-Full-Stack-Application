/**
 * Manual cleanup script - can be run separately if needed
 * Usage: node cleanup.js
 */

const db = require('./_helpers/db');

// Completely drop all tables and reset the database
async function resetDatabase() {
    console.log('\nStarting complete database reset...');
    
    try {
        // Force sync with { force: true } will drop all tables
        console.log('Dropping all tables...');
        await db.sequelize.sync({ force: true });
        
        console.log('All tables have been dropped successfully');
        console.log('Database has been completely reset');
        
        // Exit the process when done
        process.exit(0);
    } catch (error) {
        console.error('Error resetting database:', error);
        process.exit(1);
    }
}

// Run the reset function
resetDatabase(); 