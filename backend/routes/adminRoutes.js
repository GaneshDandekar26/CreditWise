const express = require('express');
const { getAllApplications, updateApplicationStatus, getAnalytics } = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

// Define Protected Admin-Only Routes
router.use(protect, adminOnly);

router.get('/applications', getAllApplications);
router.put('/applications/:id/status', updateApplicationStatus);
router.get('/analytics', getAnalytics);

module.exports = router;
