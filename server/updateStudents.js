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

// Function to generate email from name and studentId
function generateEmail(firstName, lastName, studentId) {
  const cleanFirstName = firstName.toLowerCase().replace(/[^a-z]/g, '');
  const cleanLastName = lastName.toLowerCase().replace(/[^a-z]/g, '');
  const idPart = studentId ? studentId.toLowerCase().replace('wcu', '') : '';
  return `${cleanFirstName}.${cleanLastName}.${idPart}@gmail.com`;
}

// Function to parse CSV
function parseCSV(csvContent) {
  const lines = csvContent.split('\n').filter(line => line.trim());
  const students = [];
  
  for (let i = 1; i < lines.length; i++) {
    // Split by comma and trim each value
    const values = lines[i].split(',').map(v => v.trim());
    if (values.length < 4) {
      console.log(`⚠️  Skipping row ${i + 1}: Not enough columns (${values.length})`);
      continue;
    }
    
    const firstName = (values[0] || '').trim();
    const lastName = (values[1] || '').trim();
    const id = (values[2] || '').trim();
    const department = (values[3] || '').trim();
    
    // Check if required fields are present
    if (!firstName || !lastName || !id) {
      console.log(`⚠️  Skipping row ${i + 1}: Missing required fields (firstName: "${firstName}", lastName: "${lastName}", id: "${id}")`);
      continue;
    }
    
    const normalizedId = normalizeStudentId(id);
    if (!normalizedId) {
      console.log(`⚠️  Skipping row ${i + 1}: Invalid student ID format: "${id}"`);
      continue;
    }
    
    students.push({
      firstName,
      lastName,
      studentId: normalizedId,
      department,
      rowNumber: i + 1
    });
  }
  
  return students;
}

// Main function
async function updateStudents() {
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
    console.log(`📋 Found ${csvStudents.length} valid students in CSV file`);
    
    // Count total lines (including header)
    const totalLines = csvContent.split('\n').filter(line => line.trim()).length;
    console.log(`📄 Total lines in CSV: ${totalLines} (${totalLines - 1} data rows + 1 header)\n`);
    
    if (csvStudents.length !== totalLines - 1) {
      console.log(`⚠️  Warning: ${totalLines - 1 - csvStudents.length} row(s) were skipped due to invalid data\n`);
    }

    const results = {
      updated: [],
      added: [],
      errors: [],
      noChange: []
    };

    console.log('📥 Processing students...\n');

    for (const csvStudent of csvStudents) {
      try {
        const studentData = {
          studentId: csvStudent.studentId,
          name: `${csvStudent.firstName} ${csvStudent.lastName}`,
          email: generateEmail(csvStudent.firstName, csvStudent.lastName, csvStudent.studentId),
          department: csvStudent.department || undefined,
          status: 'active'
        };

        // Find existing student
        const existing = await StudentList.findOne({ studentId: csvStudent.studentId });
        
        if (existing) {
          // Check if any fields need updating
          const needsUpdate = 
            existing.name !== studentData.name ||
            existing.department !== studentData.department ||
            existing.status !== 'active';

          if (needsUpdate) {
            // Update existing student
            existing.name = studentData.name;
            existing.department = studentData.department;
            existing.status = 'active';
            // Email is not updated to preserve existing email
            
            await existing.save();
            
            results.updated.push({
              studentId: csvStudent.studentId,
              name: studentData.name,
              changes: {
                name: existing.name !== studentData.name ? `${existing.name} → ${studentData.name}` : null,
                department: existing.department !== studentData.department ? `${existing.department || 'N/A'} → ${studentData.department || 'N/A'}` : null
              }
            });
            
            console.log(`✏️  Updated: ${studentData.name} (${csvStudent.studentId})`);
          } else {
            results.noChange.push({
              studentId: csvStudent.studentId,
              name: studentData.name
            });
            console.log(`✓  No changes: ${studentData.name} (${csvStudent.studentId})`);
          }
        } else {
          // Add new student
          const newStudent = new StudentList(studentData);
          await newStudent.save();
          
          results.added.push({
            studentId: csvStudent.studentId,
            name: studentData.name,
            email: studentData.email
          });
          
          console.log(`✅ Added: ${studentData.name} (${csvStudent.studentId})`);
        }
      } catch (err) {
        results.errors.push({
          studentId: csvStudent.studentId,
          name: `${csvStudent.firstName} ${csvStudent.lastName}`,
          error: err.message
        });
        console.log(`❌ Error: ${csvStudent.firstName} ${csvStudent.lastName} (${csvStudent.studentId}) - ${err.message}`);
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 UPDATE SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Added (new): ${results.added.length}`);
    console.log(`✏️  Updated: ${results.updated.length}`);
    console.log(`✓  No changes: ${results.noChange.length}`);
    console.log(`❌ Errors: ${results.errors.length}`);
    console.log('='.repeat(60));

    if (results.added.length > 0) {
      console.log('\n✅ ADDED STUDENTS:');
      results.added.slice(0, 10).forEach(student => {
        console.log(`   - ${student.name} (${student.studentId})`);
      });
      if (results.added.length > 10) {
        console.log(`   ... and ${results.added.length - 10} more`);
      }
    }

    if (results.updated.length > 0) {
      console.log('\n✏️  UPDATED STUDENTS:');
      results.updated.slice(0, 10).forEach(student => {
        console.log(`   - ${student.name} (${student.studentId})`);
        if (student.changes.name) {
          console.log(`     Name: ${student.changes.name}`);
        }
        if (student.changes.department) {
          console.log(`     Department: ${student.changes.department}`);
        }
      });
      if (results.updated.length > 10) {
        console.log(`   ... and ${results.updated.length - 10} more`);
      }
    }

    if (results.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      results.errors.forEach(err => {
        console.log(`   - ${err.name} (${err.studentId}): ${err.error}`);
      });
    }

    // Get total count
    const totalCount = await StudentList.countDocuments({});
    console.log(`\n📊 Total students in database: ${totalCount}`);

    await mongoose.connection.close();
    console.log('\n✅ Update completed!');

  } catch (err) {
    console.error('\n❌ Error:', err);
    process.exit(1);
  }
}

updateStudents();
