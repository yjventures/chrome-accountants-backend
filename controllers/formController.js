const pdfFillerService = require('../services/pdfFillerService');

const submitClientContactForm = async (req, res) => {
  try {
    const formData = req.body;
    const user = req.user; // From auth middleware


    // Generate filled PDF from form data
    const pdfBuffer = await pdfFillerService.generateFilledPDF(user.id, formData, false); // Keep PDF editable for now

    // Send email with PDF attachment
    const emailService = require('../services/emailService');
    await emailService.sendContactFormEmail(user, formData, pdfBuffer);

    res.status(200).json({
      success: true,
      message: 'Contact form submitted successfully'
    });

  } catch (error) {
    console.error('Error submitting contact form:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting contact form',
      error: error.message
    });
  }
};



module.exports = {
  submitClientContactForm
};
