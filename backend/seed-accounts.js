const bcrypt = require('bcryptjs');
const db = require('./_helpers/db');

async function seedAccounts() {
    console.log('Starting account seeding...');

    try {
        // Wait for database connection to be established
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check if we already have accounts
        const accountCount = await db.Account.count();
        if (accountCount > 0) {
            console.log(`${accountCount} accounts already exist, skipping seed`);
            process.exit(0);
            return;
        }

        // Create admin account
        console.log('Creating admin account...');
        const adminHash = await bcrypt.hash('admin123', 10);
        const admin = await db.Account.create({
            email: 'admin@example.com',
            passwordHash: adminHash,
            title: 'Mr',
            firstName: 'Admin',
            lastName: 'User',
            acceptTerms: true,
            role: 'Admin',
            verified: new Date(),
            status: 'Active'
        });

        // Create regular user account
        console.log('Creating regular user account...');
        const userHash = await bcrypt.hash('user123', 10);
        const user = await db.Account.create({
            email: 'user@example.com',
            passwordHash: userHash,
            title: 'Ms',
            firstName: 'Regular',
            lastName: 'User',
            acceptTerms: true,
            role: 'User',
            verified: new Date(),
            status: 'Active'
        });

        // Create test user account (Diaz@gmail.com)
        console.log('Creating test user account...');
        const testHash = await bcrypt.hash('password123', 10);
        const testUser = await db.Account.create({
            email: 'Diaz@gmail.com',
            passwordHash: testHash,
            title: 'Mr',
            firstName: 'Diaz',
            lastName: 'Test',
            acceptTerms: true,
            role: 'User',
            verified: new Date(),
            status: 'Active'
        });

        console.log('Account seeding completed successfully');
        console.log('\nTest accounts created:');
        console.log('1. Admin: admin@example.com / admin123');
        console.log('2. User: user@example.com / user123');
        console.log('3. Test: Diaz@gmail.com / password123');
        
        process.exit(0);
    } catch (error) {
        console.error('Error seeding accounts:', error);
        process.exit(1);
    }
}

// Run the seed function
seedAccounts(); 