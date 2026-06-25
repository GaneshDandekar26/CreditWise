const express = require('express');
const { registerUser, loginUser } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Define Auth Routes
router.post('/register', registerUser);
router.post('/login', loginUser);

// Protected Route for validation
router.get('/profile', protect, (req, res) => {
  res.json(req.user);
});

module.exports = router;
