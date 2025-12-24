// Test script for XLSX parsing
const XLSX = require('xlsx');

// Mock data creation (simulating a file)
const wb = XLSX.utils.book_new();
const data = [
    { "Student ID": "WCU9999", "Full Name": "Test User", "Email": "test@test.com", "CustomField": "CustomValue" },
    { "Voter ID": "WCU8888", "Name": "Another User", "e-mail": "t2@test.com", "Hobby": "Coding" }
];
const ws = XLSX.utils.json_to_sheet(data);
XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

console.log("🔍 Testing XLSX Parser Logic...");

const rawData = XLSX.utils.sheet_to_json(ws, { defval: "" });
console.log(`Shared ${rawData.length} rows found.`);

rawData.forEach((row, i) => {
    console.log(`\n--- Row ${i + 1} ---`);
    console.log("Raw Keys:", Object.keys(row));

    // Test Smart Detection Logic (Copied from server.js for verification)
    const keys = Object.keys(row);
    let studentIdKey = keys.find(k => /^(student|voter).?id|id$/i.test(k));
    let emailKey = keys.find(k => /^e.?mail$/i.test(k));
    let nameKey = keys.find(k => /^name|full.?name$/i.test(k));

    console.log(`Detected ID Key: ${studentIdKey} -> Value: ${row[studentIdKey]}`);
    console.log(`Detected Name Key: ${nameKey} -> Value: ${row[nameKey]}`);
    console.log(`Detected Email Key: ${emailKey} -> Value: ${row[emailKey]}`);

    if (row.CustomField) console.log(`Custom Field Preserved: ${row.CustomField}`);
    if (row.Hobby) console.log(`Custom Field Preserved: ${row.Hobby}`);
});
