const { PDFDocument, PDFForm, PDFTextField, PDFCheckBox, PDFPage } = require('pdf-lib');
const fs = require('fs').promises;
const path = require('path');
const { PDF_FIELD_MAPPING, CHECKBOX_FIELD_MAPPING, DATE_FIELDS } = require('./pdfFieldMapping');

class PDFFillerService {
  constructor() {
    this.templatePath = path.join(__dirname, '../../chrome-accountants-landing/public/data/CA-Client-Contact-Form.pdf');
  }

  /**
   * Format ISO date (YYYY-MM-DD) to DD/MM/YYYY
   */
  formatDate(isoDate) {
    if (!isoDate) return '';
    const date = new Date(isoDate);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  /**
   * Embed signature image into PDF
   */
  async embedSignature(pdfDoc, signatureData) {
    try {
      if (!signatureData || !signatureData.startsWith('data:image/')) {
        console.log('No valid signature data provided');
        return;
      }

      // Extract base64 data from data URL
      const base64Data = signatureData.split(',')[1];
      const imageBuffer = Buffer.from(base64Data, 'base64');
      
      // Determine image format
      let imageFormat = 'png';
      if (signatureData.includes('data:image/jpeg')) {
        imageFormat = 'jpeg';
      } else if (signatureData.includes('data:image/png')) {
        imageFormat = 'png';
      }

      // Embed the image
      const image = await pdfDoc.embedPng(imageBuffer);
      
      // Get the first page (assuming signature goes on the last page)
      const pages = pdfDoc.getPages();
      const lastPage = pages[pages.length - 1];
      
      // Define signature area (adjust coordinates as needed)
      const signatureWidth = 140; // Reduced by 30% from 200 to 140
      const signatureHeight = 20; // Reduced by 75% from 80 to 20
      const x = 100; // Left margin (unchanged)
      const y = 46;  // Moved down 2 more pixels from 48 to 46
      
      // Draw the signature image
      lastPage.drawImage(image, {
        x: x,
        y: y,
        width: signatureWidth,
        height: signatureHeight,
      });

      console.log('✓ Signature embedded successfully');
      
    } catch (error) {
      console.warn('⚠ Could not embed signature:', error.message);
    }
  }

  /**
   * Get nested value from object using dot notation
   */
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : null;
    }, obj);
  }

  /**
   * Map form data to PDF field values
   */
  mapFormDataToPDFFields(formData) {
    const pdfFields = {};
    const checkboxFields = {};

      // Map text fields
      Object.entries(PDF_FIELD_MAPPING).forEach(([dataPath, pdfFieldName]) => {
        const value = this.getNestedValue(formData, dataPath);
        if (value !== null && value !== undefined && value !== '') {
          // Check if this is a date field that needs formatting
          if (DATE_FIELDS.includes(dataPath)) {
            pdfFields[pdfFieldName] = this.formatDate(value);
          } else if (dataPath.includes('contactInfo.mobileTime') || dataPath.includes('contactInfo.homeTime') || dataPath.includes('contactInfo.workTime') ||
                     dataPath.includes('spouseDetails.mobileTime') || dataPath.includes('spouseDetails.homeTime') || dataPath.includes('spouseDetails.workTime')) {
            // For time fields, combine time and AM/PM
            const ampmPath = dataPath.replace('mobileTime', 'mobileAMPM').replace('homeTime', 'homeAMPM').replace('workTime', 'workAMPM');
            const ampmValue = this.getNestedValue(formData, ampmPath);
            const combinedTime = `${value} ${ampmValue || 'PM'}`;
            pdfFields[pdfFieldName] = combinedTime;
          // Phone fields and extensions are now mapped separately - no combination needed
          } else {
            pdfFields[pdfFieldName] = String(value);
          }
        }
      });

    // Map checkbox fields
    Object.entries(CHECKBOX_FIELD_MAPPING).forEach(([dataPath, pdfFieldName]) => {
      const value = this.getNestedValue(formData, dataPath);
      if (value !== null && value !== undefined) {
        // Handle different checkbox value types
        if (typeof value === 'boolean') {
          checkboxFields[pdfFieldName] = value;
        } else if (typeof value === 'string') {
          // For title and AM/PM selections - check if the value matches the expected value
          const expectedValue = dataPath.split('.').pop(); // Get the last part (MR, MRS, etc.)
          checkboxFields[pdfFieldName] = value === expectedValue;
        } else if (Array.isArray(value)) {
          // For selected phones arrays
          checkboxFields[pdfFieldName] = value.length > 0;
        }
      }
    });

    // Special handling for title checkboxes - check the actual title value
    const titleValue = this.getNestedValue(formData, 'contactInfo.title');
    if (titleValue) {
      // Map title to appropriate checkbox
      const titleCheckboxMap = {
        'MR': 'Check Box8',
        'MRS': 'Check Box9',
        'MS': 'Check Box10',
        'MISS': 'Check Box11',
        'DR': 'Check Box12',
        'OTHER': 'Check Box13'
      };
      
      // Set the correct checkbox based on the title value
      const checkboxField = titleCheckboxMap[titleValue];
      if (checkboxField) {
        checkboxFields[checkboxField] = true;
      }
    }

    // Special handling for spouse title checkboxes
    const spouseTitleValue = this.getNestedValue(formData, 'spouseDetails.title');
    if (spouseTitleValue) {
      const spouseTitleCheckboxMap = {
        'MR': 'Check Box3.0',
        'MRS': 'Check Box3.1',
        'MS': 'Check Box3.2',
        'MISS': 'Check Box3.3',
        'DR': 'Check Box3.4',
        'OTHER': 'Check Box3.5'
      };
      
      // Set the correct checkbox based on the spouse title value
      const checkboxField = spouseTitleCheckboxMap[spouseTitleValue];
      if (checkboxField) {
        checkboxFields[checkboxField] = true;
      }
    }

    // Special handling for phone selection checkboxes
    const clientSelectedPhones = this.getNestedValue(formData, 'contactInfo.selectedPhones');
    if (clientSelectedPhones && Array.isArray(clientSelectedPhones)) {
      const phoneCheckboxMap = {
        'mobile': 'Check Box4.0',
        'home': 'Check Box4.1',
        'work': 'Check Box4.2'
      };
      
      // Set checkboxes based on selected phone types
      clientSelectedPhones.forEach(phoneType => {
        const checkboxField = phoneCheckboxMap[phoneType];
        if (checkboxField) {
          checkboxFields[checkboxField] = true;
        }
      });
    }

    // Special handling for spouse phone selection checkboxes
    const spouseSelectedPhones = this.getNestedValue(formData, 'spouseDetails.selectedPhones');
    if (spouseSelectedPhones && Array.isArray(spouseSelectedPhones)) {
      const spousePhoneCheckboxMap = {
        'mobile': 'Check Box4.3',
        'home': 'Check Box4.4',
        'work': 'Check Box4.5'
      };
      
      // Set checkboxes based on selected spouse phone types
      spouseSelectedPhones.forEach(phoneType => {
        const checkboxField = spousePhoneCheckboxMap[phoneType];
        if (checkboxField) {
          checkboxFields[checkboxField] = true;
        }
      });
    }

    return { pdfFields, checkboxFields };
  }

  /**
   * Fill PDF form with data
   */
  async fillPDFForm(formData, flatten = false) {
    try {
      // Read the template PDF
      const templateBytes = await fs.readFile(this.templatePath);
      const pdfDoc = await PDFDocument.load(templateBytes);
      
      // Check if the PDF has forms
      if (!pdfDoc.getForm) {
        throw new Error('PDF does not contain fillable forms');
      }
      
      const form = pdfDoc.getForm();

      // Map form data to PDF fields
      const { pdfFields, checkboxFields } = this.mapFormDataToPDFFields(formData);

      // Get all form fields to check what's available
      const fields = form.getFields();
      const availableFieldNames = fields.map(field => field.getName());

      // Fill text fields
      Object.entries(pdfFields).forEach(([fieldName, value]) => {
        try {
          const field = form.getField(fieldName);
          if (field instanceof PDFTextField) {
            field.setText(value);
            console.log(`✓ Filled text field: ${fieldName} = ${value}`);
          } else {
            console.warn(`⚠ Field ${fieldName} is not a text field`);
          }
        } catch (error) {
          console.warn(`⚠ Could not fill field ${fieldName}: ${error.message}`);
        }
      });

      // Fill checkbox fields
      Object.entries(checkboxFields).forEach(([fieldName, isChecked]) => {
        try {
          const field = form.getField(fieldName);
          if (field instanceof PDFCheckBox) {
            if (isChecked) {
              field.check();
            } else {
              field.uncheck();
            }
          }
        } catch (error) {
          console.warn(`⚠ Could not fill checkbox ${fieldName}: ${error.message}`);
        }
      });

      // Embed signature if provided
      const signatureData = this.getNestedValue(formData, 'eSignature.signature');
      if (signatureData) {
        await this.embedSignature(pdfDoc, signatureData);
      }

      // Flatten form if requested
      if (flatten) {
        try {
          // Check if flattening is supported
          if (typeof form.flatten === 'function') {
            form.flatten();
            console.log('✓ Form flattened (read-only)');
          } else {
            console.warn('⚠ Form flattening not supported for this PDF');
          }
        } catch (error) {
          console.warn('⚠ Could not flatten form:', error.message);
          // Continue without flattening
        }
      }

      // Save the filled PDF
      const pdfBytes = await pdfDoc.save();
      return pdfBytes;

    } catch (error) {
      console.error('Error filling PDF form:', error);
      throw new Error(`Failed to fill PDF form: ${error.message}`);
    }
  }

  /**
   * Generate filled PDF for a user
   */
  async generateFilledPDF(userId, formData, flatten = false) {
    try {
      console.log(`Generating filled PDF for user ${userId}, flatten: ${flatten}`);
      
      const pdfBytes = await this.fillPDFForm(formData, flatten);
      
      console.log(`✓ Successfully generated PDF for user ${userId}`);
      return pdfBytes;

    } catch (error) {
      console.error(`Error generating PDF for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Enumerate all PDF field names and types (dev utility)
   */
  async enumeratePDFFields() {
    try {
      const templateBytes = await fs.readFile(this.templatePath);
      const pdfDoc = await PDFDocument.load(templateBytes);
      const form = pdfDoc.getForm();
      const fields = form.getFields();

      const fieldInfo = fields.map(field => ({
        name: field.getName(),
        type: field.constructor.name,
        isReadOnly: field.isReadOnly(),
        isRequired: field.isRequired()
      }));

      console.log('PDF Form Fields:');
      fieldInfo.forEach(field => {
        console.log(`- ${field.name} (${field.type}) - ReadOnly: ${field.isReadOnly}, Required: ${field.isRequired}`);
      });

      return fieldInfo;

    } catch (error) {
      console.error('Error enumerating PDF fields:', error);
      throw error;
    }
  }
}

module.exports = new PDFFillerService();
