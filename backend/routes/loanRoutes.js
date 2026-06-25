const express = require('express');
const { applyForLoan, getLoanHistory, updateLoanStatus } = require('../controllers/loanController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Define Protected Loan Routes
router.post('/apply', protect, applyForLoan);
router.get('/history', protect, getLoanHistory);
router.patch('/:id/status', protect, updateLoanStatus);

module.exports = router;
