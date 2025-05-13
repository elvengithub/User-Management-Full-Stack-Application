const config = require('../config.json');
const { Sequelize } = require('sequelize');

// Determine environment
const env = process.env.NODE_ENV === 'production' ? 'production' : 'development';
const envConfig = config[env];

module.exports = db = {};

initialize();

async function initialize() {
    try {
        console.log(`Using ${env} database configuration`);
        console.log(`Connecting to MySQL at ${envConfig.database.host}:${envConfig.database.port}`);
        
        // Connect to MySQL using the configuration from config.json
        const sequelize = new Sequelize(
            envConfig.database.database,
            envConfig.database.username,
            envConfig.database.password, 
            {
                host: envConfig.database.host,
                port: envConfig.database.port,
                dialect: 'mysql',
                logging: console.log, // Enable to see SQL queries
                dialectOptions: {
                    connectTimeout: 60000, // Increase connection timeout
                    // SSL configuration if needed
                    /*
                    ssl: {
                        require: true,
                        rejectUnauthorized: false
                    }
                    */
                },
                pool: {
                    max: 10, // Maximum number of connection in pool
                    min: 0, // Minimum number of connection in pool
                    acquire: 60000, // The maximum time, in milliseconds, that pool will try to get connection before throwing error
                    idle: 10000, // The maximum time, in milliseconds, that a connection can be idle before being released
                    evict: 1000 // The time interval, in milliseconds, after which sequelize-pool will remove idle connections
                },
                retry: {
                    match: [
                        /ETIMEDOUT/,
                        /EHOSTUNREACH/,
                        /ECONNRESET/,
                        /ECONNREFUSED/,
                        /ETIMEDOUT/,
                        /ESOCKETTIMEDOUT/,
                        /EHOSTUNREACH/,
                        /EPIPE/,
                        /EAI_AGAIN/,
                        /SequelizeConnectionError/,
                        /SequelizeConnectionRefusedError/,
                        /SequelizeHostNotFoundError/,
                        /SequelizeHostNotReachableError/,
                        /SequelizeInvalidConnectionError/,
                        /SequelizeConnectionTimedOutError/,
                        /SequelizeConnectionAcquireTimeoutError/
                    ],
                    max: 5 // How many times a failing query is automatically retried
                }
            }
        );

        try {
            // Test connection before proceeding
            await sequelize.authenticate();
            console.log('Connection to the database has been established successfully.');
        } catch (authError) {
            console.error('Unable to connect to the database:', authError);
            // Show MySQL configuration (hide password)
            const dbConfig = { ...envConfig.database };
            dbConfig.password = '********'; // Hide the actual password
            console.error('Database configuration:', JSON.stringify(dbConfig, null, 2));
            throw new Error('Database authentication failed');
        }

        // Initialize models
        console.log('Initializing models...');
        db.Account = require('../accounts/account.model')(sequelize);
        db.RefreshToken = require('../accounts/refresh-token.model')(sequelize);
        db.Employee = require('../employees/employee.model')(sequelize);
        db.Department = require('../employees/department.model')(sequelize);
        db.Workflow = require('../employees/workflow.model')(sequelize);
        db.Request = require('../requests/request.model')(sequelize);
        db.RequestItem = require('../requests/requestItem.model')(sequelize);

        // Setup relationships
        console.log('Setting up relationships...');
        db.Account.hasMany(db.RefreshToken, { onDelete: 'CASCADE' });
        db.RefreshToken.belongsTo(db.Account);

        // Employee-Department relationship
        db.Department.hasMany(db.Employee, { foreignKey: 'departmentId' });
        db.Employee.belongsTo(db.Department, { foreignKey: 'departmentId' });

        // Employee-Workflow relationship
        db.Employee.hasMany(db.Workflow, { foreignKey: 'employeeId' });
        db.Workflow.belongsTo(db.Employee, { foreignKey: 'employeeId' });

        // Account-Employee relationship
        db.Account.hasOne(db.Employee, { foreignKey: 'accountId' });
        db.Employee.belongsTo(db.Account, { foreignKey: 'accountId' });
        
        // Request-Employee relationship
        db.Employee.hasMany(db.Request, { foreignKey: 'employeeId' });
        db.Request.belongsTo(db.Employee, { foreignKey: 'employeeId' });

        // Request-RequestItem relationship
        db.Request.hasMany(db.RequestItem, { foreignKey: 'requestId', onDelete: 'CASCADE' });
        db.RequestItem.belongsTo(db.Request, { foreignKey: 'requestId' });

        // Sync models
        console.log('Synchronizing database schema...');
        await sequelize.sync({ alter: true });
        console.log('Database synchronized successfully');
        
    } catch (err) {
        console.error('Database initialization failed:', err);
        if (err.parent) {
            console.error('Original error:', err.parent);
        }
        if (err.original) {
            console.error('MySQL error code:', err.original.code);
            console.error('MySQL error number:', err.original.errno);
            console.error('MySQL error message:', err.original.sqlMessage);
        }
        process.exit(1);
    }
}