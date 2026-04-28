// routes/userRoutes.js
const express = require('express');
const router = express.Router();

// Import controller functions
const {
  bulkCreateUsers,
  bulkUpdateUsers,
  exportUsersJSON,
  exportUsersBSON,
  getUsers
} = require('../controllers/userController');

// ==================== ROUTES ====================

// Bulk Create Users (Supports 5000+ records)
router.post('/bulk-create', bulkCreateUsers);

// Bulk Update Users
router.post('/bulk-update', bulkUpdateUsers);

// Export Routes
router.get('/export/json', exportUsersJSON);
router.get('/export/bson', exportUsersBSON);

// Get all users (for testing / debugging)
router.get('/', getUsers);

module.exports = router;