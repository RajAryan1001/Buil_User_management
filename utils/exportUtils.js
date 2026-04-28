const User = require('../models/User');
const { BSON } = require('bson');
const fs = require('fs');
const path = require('path');

// Export to JSON
exports.exportUsersJSON = async (req, res) => {
  try {
    const users = await User.find({}).lean();
    const filePath = path.join(__dirname, '../exports/users.json');

    fs.writeFileSync(filePath, JSON.stringify(users, null, 2));

    res.download(filePath, 'users.json', (err) => {
      if (err) console.error(err);
      // Optional: fs.unlinkSync(filePath); to clean up
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Export to BSON (binary)
exports.exportUsersBSON = async (req, res) => {
  try {
    const users = await User.find({}).lean();
    const bsonData = BSON.serialize({ users });

    const filePath = path.join(__dirname, '../exports/users.bson');
    fs.writeFileSync(filePath, bsonData);

    res.download(filePath, 'users.bson');
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};