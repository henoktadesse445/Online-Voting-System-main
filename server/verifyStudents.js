const mongoose = require('mongoose');
require('dotenv').config();

const StudentList = require('./models/StudentList');

// Function to verify imported students
async function verifyStudents() {
    try {
        // Connect to MongoDB
        console.log('📡 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        // Get recent students (last 10)
        const recentStudents = await StudentList.find()
            .sort({ createdAt: -1 })
            .limit(10);

        console.log('📋 Recent Students (Last 10):');
        console.log('='.repeat(80));

        recentStudents.forEach((student, index) => {
            console.log(`\n${index + 1}. ${student.name}`);
            console.log(`   Student ID: ${student.studentId}`);
            console.log(`   Email: ${student.email}`);
            console.log(`   Department: ${student.department || 'N/A'}`);
            console.log(`   Status: ${student.status}`);
            console.log(`   Created: ${student.createdAt.toLocaleString()}`);
        });

        console.log('\n' + '='.repeat(80));
        console.log(`\n📊 Total students in database: ${await StudentList.countDocuments()}`);

        // Close connection
        await mongoose.connection.close();
        console.log('\n✅ Verification completed! Database connection closed.');

    } catch (err) {
        console.error('\n❌ Error during verification:', err);
        process.exit(1);
    }
}

// Run the verification
verifyStudents();
