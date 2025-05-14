const db = require('./_helpers/db');

async function seedDepartments() {
    console.log('Starting department seeding...');

    try {
        // Wait for database connection
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check if we already have departments
        const departmentCount = await db.Department.count();
        if (departmentCount > 0) {
            console.log(`${departmentCount} departments already exist, skipping seed`);
            process.exit(0);
            return;
        }

        // Create departments
        console.log('Creating departments...');
        await db.Department.bulkCreate([
            { 
                name: 'IT', 
                description: 'Information Technology Department' 
            },
            { 
                name: 'Engineering', 
                description: 'Engineering Department' 
            },
            { 
                name: 'HR', 
                description: 'Human Resources Department' 
            },
            { 
                name: 'Finance', 
                description: 'Finance Department' 
            },
            { 
                name: 'Marketing', 
                description: 'Marketing Department' 
            }
        ]);

        console.log('Department seeding completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding departments:', error);
        process.exit(1);
    }
}

// Run the seed function
seedDepartments(); 