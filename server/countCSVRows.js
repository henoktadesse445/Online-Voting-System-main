const fs = require('fs');
const path = require('path');

const csvPath = path.join(__dirname, '..', '..', '..', 'Student_list.csv');
const csvContent = fs.readFileSync(csvPath, 'utf8');
const lines = csvContent.split('\n');

console.log(`Total lines in file: ${lines.length}\n`);

const dataRows = [];
for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) {
    console.log(`Line ${i + 1}: EMPTY LINE`);
    continue;
  }
  
  const values = line.split(',').map(v => v.trim());
  console.log(`Line ${i + 1}: ${values[0] || 'N/A'}, ${values[1] || 'N/A'}, ${values[2] || 'N/A'}`);
  
  if (values.length >= 3 && values[0] && values[1] && values[2]) {
    dataRows.push({
      row: i + 1,
      firstName: values[0],
      lastName: values[1],
      id: values[2]
    });
  } else {
    console.log(`  ⚠️  INVALID: Missing required fields`);
  }
}

console.log(`\n✅ Valid data rows: ${dataRows.length}`);
console.log(`📄 Total non-empty lines (excluding header): ${lines.filter((l, i) => i > 0 && l.trim()).length}`);
