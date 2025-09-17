const express = require('express');
const router = express.Router();
const formController = require('../controllers/formController');
const { authenticate } = require('../middleware/auth');

// Submit client contact form
router.post('/contact', authenticate, formController.submitClientContactForm);

module.exports = router;
