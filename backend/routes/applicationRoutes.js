const express = require('express');
const { createApplication, getApplications, updateApplicationStatus } = require('../controllers/applicationController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Define Protected Routes
router.route('/')
  .post(protect, createApplication)
  .get(protect, getApplications);

router.route('/:id/status')
  .patch(protect, updateApplicationStatus);

module.exports = router;
