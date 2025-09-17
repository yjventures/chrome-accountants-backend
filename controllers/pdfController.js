const pdfFillerService = require('../services/pdfFillerService');

/**
 * Generate filled PDF for a user
 * GET /api/pdf/generate/:userId?flatten=true
 */
const generatePDF = async (req, res) => {
  try {
    const { userId } = req.params;
    const { flatten } = req.query;
    const shouldFlatten = flatten === 'true';

    // TODO: Replace with actual user data retrieval from database
    // For now, we'll use the form data from the request body
    const formData = req.body;

    if (!formData) {
      return res.status(400).json({
        success: false,
        message: 'Form data is required'
      });
    }

    // Generate the filled PDF
    const pdfBytes = await pdfFillerService.generateFilledPDF(userId, formData, shouldFlatten);

    // Set PII-safe headers
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="client-contact-form-${userId}.pdf"`,
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Surrogate-Control': 'no-store'
    });

    res.send(pdfBytes);

  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating PDF',
      error: error.message
    });
  }
};

/**
 * Enumerate PDF fields (dev utility)
 * GET /api/pdf/fields
 */
const enumerateFields = async (req, res) => {
  try {
    const fieldInfo = await pdfFillerService.enumeratePDFFields();
    
    res.json({
      success: true,
      fields: fieldInfo,
      count: fieldInfo.length
    });

  } catch (error) {
    console.error('Error enumerating PDF fields:', error);
    res.status(500).json({
      success: false,
      message: 'Error enumerating PDF fields',
      error: error.message
    });
  }
};

/**
 * Test PDF generation with sample data
 * POST /api/pdf/test
 */
const testPDFGeneration = async (req, res) => {
  try {
    const { flatten } = req.query;
    const shouldFlatten = flatten === 'true';

    // Sample form data for testing
    const sampleFormData = {
      personalDetails: {
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: '1990-01-15',
        ssn: '123456789',
        title: 'MR'
      },
      contactInfo: {
        email: 'john.doe@example.com',
        mobilePhone: '0412345678',
        homePhone: '0298765432',
        workPhone: '0398765432',
        homeExtension: '02',
        workExtension: '03',
        mobileTime: '09:30',
        homeTime: '18:00',
        workTime: '17:30',
        mobileAMPM: 'AM',
        homeAMPM: 'PM',
        workAMPM: 'PM',
        selectedPhones: ['mobile', 'home', 'work']
      },
      spouseDetails: {
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane.doe@example.com',
        title: 'MRS',
        mobilePhone: '0412345679',
        homePhone: '0298765433',
        workPhone: '0398765433',
        homeExtension: '02',
        workExtension: '03',
        mobileTime: '10:00',
        homeTime: '19:00',
        workTime: '18:00',
        mobileAMPM: 'AM',
        homeAMPM: 'PM',
        workAMPM: 'PM',
        selectedPhones: ['mobile', 'home']
      },
      addressDetails: {
        residentialAddress: '123 Main Street',
        residentialCity: 'Sydney',
        residentialState: 'NSW',
        residentialZip: '2000',
        postalDifferent: false
      },
      bankingDetails: {
        bankName: 'John Doe',
        accountNumber: '12345678',
        routingNumber: '062000'
      },
      additionalInfo: {
        occupation: 'Google Search',
        consentGiven: true
      },
      eSignature: {
        signatureDate: '2024-01-15'
      }
    };

    const pdfBytes = await pdfFillerService.generateFilledPDF('test-user', sampleFormData, shouldFlatten);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="test-client-contact-form.pdf"`,
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Surrogate-Control': 'no-store'
    });

    res.send(pdfBytes);

  } catch (error) {
    console.error('Error in test PDF generation:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating test PDF',
      error: error.message
    });
  }
};

module.exports = {
  generatePDF,
  enumerateFields,
  testPDFGeneration
};
