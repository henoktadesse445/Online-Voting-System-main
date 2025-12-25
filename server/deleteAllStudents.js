const mongoose = require('mongoose');
require('dotenv').config();

const StudentList = require('./models/StudentList');
const User = require('./models/User');
const OTP = require('./models/OTP');

// Function to delete all students from the database
async function deleteAllStudents() {
    try {
        // Connect to MongoDB
        console.log('📡 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Get count before deletion
        const countBefore = await StudentList.countDocuments();
        console.log(`\n📋 Found ${countBefore} students in database`);

        if (countBefore === 0) {
            console.log('\n⚠️  Database is already empty. Nothing to delete.');
            await mongoose.connection.close();
            return;
        }

        // Ask for confirmation (comment out if you want to skip confirmation)
        console.log('\n⚠️  WARNING: This will delete ALL student records!');
        console.log('Press Ctrl+C to cancel, or wait 3 seconds to proceed...\n');

        // Wait 3 seconds for user to cancel
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Delete all students, voters, and OTPs
        console.log('🗑️  Deleting all students, voters, and OTP records...');
        const result = await StudentList.deleteMany({});
        const userResult = await User.deleteMany({ role: { $in: ['voter', undefined, null] } });
        await OTP.deleteMany({});

        // Summary
        console.log('\n' + '='.repeat(50));
        console.log('📊 DELETION SUMMARY');
        console.log('='.repeat(50));
        console.log(`✅ Successfully deleted: ${result.deletedCount} students`);
        console.log(`✅ Successfully deleted associated voter accounts: ${userResult.deletedCount}`);
        console.log('='.repeat(50));

        // Close connection
        await mongoose.connection.close();
        console.log('\n✅ Deletion completed! Database connection closed.');

    } catch (err) {
        console.error('\n❌ Error during deletion:', err);
        process.exit(1);
    }
}

// Run the deletion
deleteAllStudents();
