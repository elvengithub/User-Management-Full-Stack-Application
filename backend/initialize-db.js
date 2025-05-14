const path = require('path');
const { exec } = require('child_process');

console.log('===== DATABASE INITIALIZATION SCRIPT =====');
console.log('This script will:');
console.log('1. Reset the database (drop all tables)');
console.log('2. Seed the database with initial data');
console.log('=======================================\n');

// Run each script in sequence
async function runScript(scriptName) {
    return new Promise((resolve, reject) => {
        const scriptPath = path.join(__dirname, scriptName);
        console.log(`Running ${scriptName}...`);
        
        const child = exec(`node ${scriptPath}`, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error executing ${scriptName}: ${error.message}`);
                reject(error);
                return;
            }
            if (stderr) {
                console.error(`${scriptName} stderr: ${stderr}`);
            }
            console.log(stdout);
            resolve();
        });
        
        // Forward stdout and stderr to console in real-time
        child.stdout.on('data', (data) => {
            process.stdout.write(data);
        });
        
        child.stderr.on('data', (data) => {
            process.stderr.write(data);
        });
    });
}

async function initializeDatabase() {
    try {
        // Step 1: Reset the database
        await runScript('db-reset.js');
        
        // Step 2: Seed accounts
        await runScript('seed-accounts.js');
        
        // Step 3: Seed departments
        await runScript('seed-departments.js');
        
        console.log('\n===== DATABASE INITIALIZATION COMPLETE =====');
        console.log('You can now start the application');
        process.exit(0);
    } catch (error) {
        console.error('Database initialization failed:', error);
        process.exit(1);
    }
}

// Run the initialization
initializeDatabase(); 