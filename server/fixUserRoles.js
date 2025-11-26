const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');

async function fixUserRoles() {
  try {
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find users without a role or with null role (but not candidates or admins)
    const usersWithoutRole = await User.find({
      $or: [
        { role: { $exists: false } },
        { role: null },
        { role: "" }
      ],
      $nor: [
        { role: "candidate" },
        { role: "admin" }
      ]
    });

    console.log(`📋 Found ${usersWithoutRole.length} users without role set\n`);

    if (usersWithoutRole.length === 0) {
      console.log('✅ All users already have roles set!');
      await mongoose.connection.close();
      return;
    }

    // Update all users without role to have role="voter"
    const result = await User.updateMany(
      {
        $or: [
          { role: { $exists: false } },
          { role: null },
          { role: "" }
        ],
        $nor: [
          { role: "candidate" },
          { role: "admin" }
        ]
      },
      {
        $set: { role: "voter" }
      }
    );

    console.log(`✅ Updated ${result.modifiedCount} users to have role="voter"`);

    // Verify the fix
    const votersCount = await User.countDocuments({ role: "voter" });
    const usersStillWithoutRole = await User.countDocuments({
      $or: [
        { role: { $exists: false } },
        { role: null },
        { role: "" }
      ],
      $nor: [
        { role: "candidate" },
        { role: "admin" }
      ]
    });

    console.log(`\n📊 Verification:`);
    console.log(`   Total voters (role="voter"): ${votersCount}`);
    console.log(`   Users still without role: ${usersStillWithoutRole}`);

    await mongoose.connection.close();
    console.log('\n✅ Fix completed!');
  } catch (err) {
    console.error('\n❌ Error:', err);
    process.exit(1);
  }
}

fixUserRoles();

