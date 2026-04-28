// controllers/userController.js
const User = require('../models/User');

// 1. Bulk Create Users
exports.bulkCreateUsers = async (req, res) => {
  try {
    const { users } = req.body;

    if (!Array.isArray(users) || users.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Users must be a non-empty array"
      });
    }

    if (users.length > 10000) {
      return res.status(400).json({
        success: false,
        message: "Maximum 10,000 users allowed per request"
      });
    }

    const result = await User.insertMany(users, { 
      ordered: false 
    });

    res.status(201).json({
      success: true,
      message: `Successfully created ${result.length} users`,
      insertedCount: result.length
    });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Duplicate email or username detected",
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: "Bulk create failed",
      error: error.message
    });
  }
};

// 2. Bulk Update Users
exports.bulkUpdateUsers = async (req, res) => {
  try {
    const { updates } = req.body;

    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Updates must be a non-empty array"
      });
    }

    const operations = updates.map((item) => ({
      updateOne: {
        filter: item.filter,
        update: { $set: item.update },
        upsert: false
      }
    }));

    const result = await User.bulkWrite(operations, { ordered: false });

    res.json({
      success: true,
      message: "Bulk update completed successfully",
      modifiedCount: result.modifiedCount,
      matchedCount: result.matchedCount
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Bulk update failed",
      error: error.message
    });
  }
};

// 3. Export Users as JSON
exports.exportUsersJSON = async (req, res) => {
  try {
    const users = await User.find({}).lean().select('-__v');

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=users.json');

    res.json(users);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Export Users as BSON
exports.exportUsersBSON = async (req, res) => {
  try {
    const { BSON } = require('bson');
    const users = await User.find({}).lean();

    const bsonData = BSON.serialize({ users, exportedAt: new Date() });

    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', 'attachment; filename=users.bson');

    res.send(bsonData);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 5. Get All Users (for testing)
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-__v').limit(100); // limit for safety
    res.json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};