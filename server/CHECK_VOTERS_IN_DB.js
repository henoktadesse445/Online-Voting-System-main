// Quick script to check if voters exist in database
// Run this in MongoDB shell or as a test endpoint

const checkVoters = async () => {
  const User = require('./models/User');
  const mongoose = require('mongoose');
  require('dotenv').config();
  
  await mongoose.connect(process.env.MONGO_URI);
  
  console.log('🔍 Checking all users in database...\n');
  
  // Get all users
  const allUsers = await User.find({}).select('name email role voterId voteStatus');
  console.log(`Total users: ${allUsers.length}\n`);
  
  // Get voters
  const voters = await User.find({ 
    $or: [
      { role: { $in: ["voter", undefined, null, ""] } },
      { role: { $exists: false } }
    ],
    role: { $ne: "candidate" }
  }).select('name email role voterId voteStatus');
  
  console.log(`Voters found: ${voters.length}`);
  voters.forEach(v => {
    console.log(`  - ${v.name} (${v.email}) - Role: ${v.role || 'null'} - Voted: ${v.voteStatus || false}`);
  });
  
  // Check specific names
  console.log('\n🔍 Searching for specific voters:');
  const haba = await User.find({ name: { $regex: /haba/i } });
  const aman = await User.find({ name: { $regex: /aman/i } });
  
  console.log(`\nHaba matches: ${haba.length}`);
  haba.forEach(u => console.log(`  - ${u.name} (${u.email}) - Role: ${u.role || 'null'}`));
  
  console.log(`\nAman matches: ${aman.length}`);
  aman.forEach(u => console.log(`  - ${u.name} (${u.email}) - Role: ${u.role || 'null'}`));
  
  await mongoose.disconnect();
};

// Uncomment to run:
// checkVoters();

module.exports = checkVoters;

