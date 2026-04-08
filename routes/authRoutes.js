const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController.js');
const authenticateToken = require('../middleware/authMiddleware.js');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/dashboard', authenticateToken, authController.dashboard);
router.post('/refresh-token', authController.refreshToken);
router.delete('/logout', authController.logout);

module.exports = router;