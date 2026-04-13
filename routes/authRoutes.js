const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController.js');
const authenticateToken = require('../middleware/authMiddleware.js');
const validate = require('../middleware/validate');
const { registerSchema, loginSchema } = require('../controllers/authValidation.js');

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.get('/dashboard', authenticateToken, authController.dashboard);
router.post('/refresh-token', authController.refreshToken);
router.delete('/logout', authController.logout);

module.exports = router;