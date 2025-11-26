const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

const StudentList = require('./models/StudentList');

// Function to normalize student ID
function normalizeStudentId(id) {
  if (!id) return null;
  id = String(id).trim().toUpperCase();
  id = id.replace(/^WCUR/, 'WCU');
  if (!id.startsWith('WCU')) return null;
  const numberPart = id.replace('WCU', '');
  if (numberPart.length < 7) {
    return `WCU${numberPart.padStart(7, '0')}`;
  }
  if (numberPart.length === 7) return id;
  if (numberPart.length > 7) {
    return `WCU${numberPart.substring(0, 7)}`;
  }
  return id;
}

// // Function to generate email from name and studentId
// function generateEmail(firstName, lastName, studentId) {
//   const cleanFirstName = firstName.toLowerCase().replace(/[^a-z]/g, '');
//   const cleanLastName = lastName.toLowerCase().replace(/[^a-z]/g, '');
//   const idPart = studentId ? studentId.toLowerCase().replace('wcu', '') : '';
//   return `${cleanFirstName}.${cleanLastName}.${idPart}@gmail.com`;
// }

// Function to parse CSV
function parseCSV(csvContent) {
  const lines = csvContent.split('\n').filter(line => line.trim());
  const students = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    if (values.length < 4) continue;
    
    const firstName = values[0] || '';
    const lastName = values[1] || '';
    const id = values[2] || '';
    const department = values[3] || '';
    
    if (!firstName || !lastName || !id) continue;
    
    const normalizedId = normalizeStudentId(id);
    if (!normalizedId) continue;
    
    students.push({
      firstName,
      lastName,
      studentId: normalizedId,
      department
    });
  }
  
  return students;
}

// Main function
async function checkAndImport() {
  try {
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Read CSV file
    const csvPath = path.join(__dirname, '..', '..', '..', 'Student_list.csv');
    console.log(`📖 Reading CSV file: ${csvPath}`);
    
    if (!fs.existsSync(csvPath)) {
      throw new Error(`CSV file not found at: ${csvPath}`);
    }
    
    const csvContent = fs.readFileSync(csvPath, 'utf8');
    const csvStudents = parseCSV(csvContent);
    console.log(`📋 Found ${csvStudents.length} students in CSV file`);

    // Get all students from database
    const dbStudents = await StudentList.find({}).select('studentId name email');
    const dbStudentIds = new Set(dbStudents.map(s => s.studentId));
    console.log(`📊 Found ${dbStudents.length} students in database\n`);

    // Find missing students
    const missingStudents = csvStudents.filter(csvStudent => 
      !dbStudentIds.has(csvStudent.studentId)
    );

    console.log(`🔍 Missing students: ${missingStudents.length}\n`);

    if (missingStudents.length === 0) {
      console.log('✅ All students from CSV are already in the database!');
      await mongoose.connection.close();
      return;
    }

    // Import missing students
    console.log('📥 Importing missing students...\n');
    
    const results = {
      success: [],
      errors: []
    };

    for (const student of missingStudents) {
      try {
        const studentData = {
          studentId: student.studentId,
          name: `${student.firstName} ${student.lastName}`,
          email: generateEmail(student.firstName, student.lastName, student.studentId),
          department: student.department || undefined,
          status: 'active'
        };

        const newStudent = new StudentList(studentData);
        await newStudent.save();
        
        results.success.push({
          studentId: student.studentId,
          name: studentData.name,
          email: studentData.email
        });
        
        console.log(`✅ Added: ${studentData.name} (${student.studentId})`);
      } catch (err) {
        results.errors.push({
          studentId: student.studentId,
          name: `${student.firstName} ${student.lastName}`,
          error: err.message
        });
        console.log(`❌ Error: ${student.firstName} ${student.lastName} (${student.studentId}) - ${err.message}`);
      }
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 IMPORT SUMMARY');
    console.log('='.repeat(50));
    console.log(`✅ Successfully imported: ${results.success.length}`);
    console.log(`❌ Errors: ${results.errors.length}`);
    console.log(`📊 Total in database now: ${dbStudents.length + results.success.length}`);
    console.log('='.repeat(50));

    if (results.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      results.errors.forEach(err => {
        console.log(`  - ${err.name} (${err.studentId}): ${err.error}`);
      });
    }

    await mongoose.connection.close();
    console.log('\n✅ Check and import completed!');

  } catch (err) {
    console.error('\n❌ Error:', err);
    process.exit(1);
  }
}

checkAndImport();
