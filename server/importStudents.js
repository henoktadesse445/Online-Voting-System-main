const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

const StudentList = require('./models/StudentList');

// Function to normalize student ID
// Handles formats like: WCUR1409500, WCU1402659, WCU131493
function normalizeStudentId(id) {
  if (!id) return null;

  // Remove any whitespace
  id = String(id).trim().toUpperCase();

  // Remove 'R' if present (WCUR -> WCU)
  id = id.replace(/^WCUR/, 'WCU');

  // Ensure it starts with WCU
  if (!id.startsWith('WCU')) {
    return null;
  }

  // Extract the number part
  const numberPart = id.replace('WCU', '');

  // Pad with leading zeros to make it 7 digits if needed
  if (numberPart.length < 7) {
    const paddedNumber = numberPart.padStart(7, '0');
    return `WCU${paddedNumber}`;
  }

  // If exactly 7 digits, return as is
  if (numberPart.length === 7) {
    return id;
  }

  // If more than 7 digits, take first 7
  if (numberPart.length > 7) {
    return `WCU${numberPart.substring(0, 7)}`;
  }

  return id;
}

// Function to generate email from name and studentId
function generateEmail(firstName, lastName, studentId) {
  // Remove special characters and spaces
  const cleanFirstName = firstName.toLowerCase().replace(/[^a-z]/g, '');
  const cleanLastName = lastName.toLowerCase().replace(/[^a-z]/g, '');
  const idPart = studentId ? studentId.toLowerCase().replace('wcu', '') : '';

  // Create email: firstname.lastname.studentid@gmail.com
  return `${cleanFirstName}.${cleanLastName}.${idPart}@gmail.com`;
}

// Function to parse CSV
function parseCSV(csvContent) {
  const lines = csvContent.split('\n').filter(line => line.trim());
  const headers = lines[0].split(',').map(h => h.trim());

  const students = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    if (values.length < 4) continue;

    const firstName = values[0] || '';
    const lastName = values[1] || '';
    const id = values[2] || '';
    const email = values[3] || '';
    const department = values[4] || '';

    let cgpa = undefined;
    if (values[5]) {
      const parsed = parseFloat(values[5]);
      if (!isNaN(parsed)) {
        cgpa = parsed;
      }
    }

    if (!firstName || !lastName || !id || !email) {
      console.log(`⚠️  Skipping row ${i + 1}: Missing required fields (firstName, lastName, id, or email)`);
      continue;
    }

    // ... (rest of validation) ...

    const normalizedId = normalizeStudentId(id);
    if (!normalizedId) {
      console.log(`⚠️  Skipping row ${i + 1}: Invalid student ID: ${id}`);
      continue;
    }

    students.push({
      firstName,
      lastName,
      studentId: normalizedId,
      email,
      department,
      cgpa
    });
  }

  return students;
}


// Import students
console.log('\n📥 Importing students into database...\n');

const results = {
  success: [],
  errors: [],
  skipped: []
};

for (const student of studentsToImport) {
  try {
    // Check if student already exists
    const existing = await StudentList.findOne({ studentId: student.studentId });
    if (existing) {
      results.skipped.push({
        studentId: student.studentId,
        name: student.name,
        reason: 'Already exists in database'
      });
      console.log(`⏭️  Skipped: ${student.name} (${student.studentId}) - already exists`);
      continue;
    }

    // Create new student
    const newStudent = new StudentList(student);
    await newStudent.save();

    results.success.push({
      studentId: student.studentId,
      name: student.name,
      email: student.email
    });

    console.log(`✅ Added: ${student.name} (${student.studentId})`);
  } catch (err) {
    results.errors.push({
      studentId: student.studentId,
      name: student.name,
      error: err.message
    });
    console.log(`❌ Error: ${student.name} (${student.studentId}) - ${err.message}`);
  }
}

// Summary
console.log('\n' + '='.repeat(50));
console.log('📊 IMPORT SUMMARY');
console.log('='.repeat(50));
console.log(`✅ Successfully imported: ${results.success.length}`);
console.log(`⏭️  Skipped (already exists): ${results.skipped.length}`);
console.log(`❌ Errors: ${results.errors.length}`);
console.log('='.repeat(50));

if (results.errors.length > 0) {
  console.log('\n❌ ERRORS:');
  results.errors.forEach(err => {
    console.log(`  - ${err.name} (${err.studentId}): ${err.error}`);
  });
}

if (results.skipped.length > 0 && results.skipped.length <= 10) {
  console.log('\n⏭️  SKIPPED:');
  results.skipped.forEach(skip => {
    console.log(`  - ${skip.name} (${skip.studentId}): ${skip.reason}`);
  });
}

// Close connection
await mongoose.connection.close();
console.log('\n✅ Import completed! Database connection closed.');

  } catch (err) {
  console.error('\n❌ Error during import:', err);
  process.exit(1);
}
}

// Run the import
importStudents();
