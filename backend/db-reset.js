const config = require('./config.json');
const { Sequelize } = require('sequelize');

// Determine environment
const env = process.env.NODE_ENV === 'production' ? 'production' : 'development';
const envConfig = config[env];

async function resetDatabase() {
    let sequelize;
    
    try {
        console.log('===== DATABASE RESET TOOL =====');
        console.log(`Using ${env} environment`);
        console.log(`Connecting to MySQL at ${envConfig.database.host}:${envConfig.database.port}`);
        
        // Create Sequelize instance
        sequelize = new Sequelize(
            envConfig.database.database,
            envConfig.database.username,
            envConfig.database.password, 
            {
                host: envConfig.database.host,
                port: envConfig.database.port,
                dialect: 'mysql',
                logging: console.log
            }
        );
        
        // Test connection
        await sequelize.authenticate();
        console.log('Connection established successfully.');
        
        // Disable foreign key checks to avoid constraint errors
        console.log('Disabling foreign key checks...');
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
        
        // Define tables in the correct order
        console.log('Loading models...');
        const Account = require('./accounts/account.model')(sequelize);
        const RefreshToken = require('./accounts/refresh-token.model')(sequelize);
        const Employee = require('./employees/employee.model')(sequelize);
        const Department = require('./employees/department.model')(sequelize);
        const Workflow = require('./employees/workflow.model')(sequelize);
        const Request = require('./requests/request.model')(sequelize);
        const RequestItem = require('./requests/requestItem.model')(sequelize);
        
        // Drop tables manually in the correct order
        console.log('Dropping all tables individually...');
        
        // Drop tables with foreign keys first
        console.log('Dropping related tables...');
        await sequelize.query('DROP TABLE IF EXISTS requestItems');
        await sequelize.query('DROP TABLE IF EXISTS requests');
        await sequelize.query('DROP TABLE IF EXISTS workflows');
        await sequelize.query('DROP TABLE IF EXISTS refreshTokens');
        await sequelize.query('DROP TABLE IF EXISTS employees');
        
        // Then drop parent tables
        console.log('Dropping parent tables...');
        await sequelize.query('DROP TABLE IF EXISTS departments');
        await sequelize.query('DROP TABLE IF EXISTS accounts');
        
        console.log('All tables have been dropped successfully.');
        
        // Re-enable foreign key checks
        console.log('Re-enabling foreign key checks...');
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
        
        // Recreate tables but empty
        console.log('Creating empty tables...');
        await sequelize.sync();
        
        console.log('\n==================================');
        console.log('DATABASE RESET COMPLETED SUCCESSFULLY');
        console.log('All tables have been dropped and recreated empty');
        console.log('==================================\n');
        
    } catch (error) {
        console.error('Database reset failed:', error);
        
        if (error.parent) {
            console.error('Original error:', error.parent);
        }
        
        // Try to re-enable foreign key checks even if we failed
        try {
            if (sequelize) {
                await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
            }
        } catch (e) {
            console.error('Failed to re-enable foreign key checks:', e);
        }
        
        process.exit(1);
    } finally {
        if (sequelize) {
            console.log('Closing database connection...');
            await sequelize.close();
        }
        process.exit(0);
    }
}

// Run the reset
resetDatabase(); 