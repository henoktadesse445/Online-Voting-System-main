const mongoose = require('mongoose');
require('dotenv').config();

const StudentList = require('./models/StudentList');

async function verify() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    const totalStudents = await StudentList.countDocuments({});
    const activeStudents = await StudentList.countDocuments({ status: 'active' });
    
    console.log(`📊 Database Statistics:`);
    console.log(`   Total students: ${totalStudents}`);
    console.log(`   Active students: ${activeStudents}`);
    
    const students = await StudentList.find({}).select('studentId name department').sort({ studentId: 1 });
    console.log(`\n📋 All ${students.length} students in database:\n`);
    
    students.forEach((student, index) => {
      console.log(`${(index + 1).toString().padStart(3, ' ')}. ${student.studentId} - ${student.name} (${student.department || 'N/A'})`);
    });
    
    console.log(`\n✅ Verification complete: ${totalStudents} students in database`);
    
    if (totalStudents < 95) {
      console.log(`\n⚠️  Note: Database has ${totalStudents} students. To add a 95th student, please add it to the CSV file or use the addStudent.js script.`);
    }
    
    await mongoose.connection.close();
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

verify();
