const mongoose = require('mongoose');
require('dotenv').config();

const StudentList = require('./models/StudentList');

// This script can be used to add individual students
// Usage: node addStudent.js "FirstName" "LastName" "WCU1234567" "Department" "email@gmail.com"

async function addStudent() {
  try {
    const args = process.argv.slice(2);
    
    if (args.length < 3) {
      console.log('Usage: node addStudent.js "FirstName" "LastName" "StudentID" "Department" [Email]');
      console.log('Example: node addStudent.js "JOHN" "DOE" "WCU1234567" "Computer Science" "john@gmail.com"');
      process.exit(1);
    }

    const [firstName, lastName, studentId, department, email] = args;
    
    if (!firstName || !lastName || !studentId) {
      console.error('❌ Error: FirstName, LastName, and StudentID are required');
      process.exit(1);
    }

    // Normalize student ID
    let normalizedId = studentId.trim().toUpperCase();
    normalizedId = normalizedId.replace(/^WCUR/, 'WCU');
    
    if (!normalizedId.startsWith('WCU')) {
      console.error('❌ Error: Student ID must start with WCU');
      process.exit(1);
    }
    
    const numberPart = normalizedId.replace('WCU', '');
    if (numberPart.length < 7) {
      normalizedId = `WCU${numberPart.padStart(7, '0')}`;
    } else if (numberPart.length > 7) {
      normalizedId = `WCU${numberPart.substring(0, 7)}`;
    }

    // Generate email if not provided
    let studentEmail = email;
    if (!studentEmail) {
      const cleanFirstName = firstName.toLowerCase().replace(/[^a-z]/g, '');
      const cleanLastName = lastName.toLowerCase().replace(/[^a-z]/g, '');
      const idPart = normalizedId.toLowerCase().replace('wcu', '');
      studentEmail = `${cleanFirstName}.${cleanLastName}.${idPart}@gmail.com`;
    }

    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Check if student already exists
    const existing = await StudentList.findOne({ studentId: normalizedId });
    if (existing) {
      console.log(`⚠️  Student with ID ${normalizedId} already exists:`);
      console.log(`   Name: ${existing.name}`);
      console.log(`   Email: ${existing.email}`);
      await mongoose.connection.close();
      return;
    }

    // Create new student
    const newStudent = new StudentList({
      studentId: normalizedId,
      name: `${firstName} ${lastName}`,
      email: studentEmail,
      department: department || undefined,
      status: 'active'
    });

    await newStudent.save();
    
    console.log('✅ Student added successfully!');
    console.log(`   Name: ${newStudent.name}`);
    console.log(`   Student ID: ${newStudent.studentId}`);
    console.log(`   Email: ${newStudent.email}`);
    console.log(`   Department: ${newStudent.department || 'Not specified'}`);

    await mongoose.connection.close();
    console.log('\n✅ Done!');

  } catch (err) {
    console.error('\n❌ Error:', err.message);
    if (err.code === 11000) {
      console.error('   Student ID already exists in database');
    }
    process.exit(1);
  }
}

addStudent();
