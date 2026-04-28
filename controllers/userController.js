
const User = require('../models/User');

// ==================== BULK CREATE (Optimized for 5000+) ====================
exports.bulkCreateUsers = async (req, res) => {
  try {
    const { users } = req.body;

    if (!Array.isArray(users) || users.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Users must be a non-empty array"
      });
    }

    if (users.length > 15000) {
      return res.status(400).json({
        success: false,
        message: "Maximum 15,000 users allowed per request"
      });
    }

    const result = await User.insertMany(users, { 
      ordered: false, 
      rawResult: true 
    });

    const insertedCount = result.insertedCount || users.length;

    res.status(201).json({
      success: true,
      message: "Bulk user creation completed successfully",
      totalReceived: users.length,
      successfullyInserted: insertedCount,
      failedCount: users.length - insertedCount,
      note: (users.length - insertedCount > 0) 
        ? "Some records were skipped due to duplicate email or username" 
        : "All records inserted successfully"
    });

  } catch (error) {
    console.error("Bulk Create Error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Duplicate key error - Some users already exist (email or username)",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error during bulk creation",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ==================== BULK UPDATE ====================
exports.bulkUpdateUsers = async (req, res) => {
  try {
    const { updates } = req.body;

    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Updates array cannot be empty"
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
      matchedCount: result.matchedCount,
      upsertedCount: result.upsertedCount || 0
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Bulk update failed",
      error: error.message
    });
  }
};

// ==================== GET USERS (with pagination) ====================
exports.getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;

    const users = await User.find({})
      .select('-__v')
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await User.countDocuments();

    res.json({
      success: true,
      totalUsers: total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      count: users.length,
      users
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== EXPORT JSON ====================
exports.exportUsersJSON = async (req, res) => {
  try {
    const users = await User.find({}).select('-__v').lean();

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=users_${new Date().toISOString().slice(0,10)}.json`);

    res.json({
      total: users.length,
      exportedAt: new Date(),
      users
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== EXPORT BSON ====================
exports.exportUsersBSON = async (req, res) => {
  try {
    const { BSON } = require('bson');
    const users = await User.find({}).lean();

    const data = {
      total: users.length,
      exportedAt: new Date(),
      users
    };

    const bsonData = BSON.serialize(data);

    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename=users_${new Date().toISOString().slice(0,10)}.bson`);

    res.send(bsonData);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};