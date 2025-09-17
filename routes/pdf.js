const express = require('express');
const router = express.Router();
const pdfController = require('../controllers/pdfController');
const { authenticate } = require('../middleware/auth');

// Generate filled PDF for a user
router.get('/generate/:userId', authenticate, pdfController.generatePDF);

// Enumerate PDF fields (dev utility)
router.get('/fields', pdfController.enumerateFields);

// Test PDF generation with sample data
router.post('/test', pdfController.testPDFGeneration);

module.exports = router;
