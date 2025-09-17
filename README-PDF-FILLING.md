# PDF Form Filling System

This system pre-fills the existing fillable PDF template (`CA-Client-Contact-Form.pdf`) with client data instead of generating a new PDF from scratch.

## Overview

The system consists of:
- **PDF Field Mapping**: Maps database field names to PDF form field names
- **PDF Filling Service**: Handles the actual PDF manipulation and filling
- **HTTP Endpoints**: API endpoints for PDF generation and testing
- **Dev Utilities**: Tools for maintaining field mappings

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │───▶│   Backend API    │───▶│  PDF Filler     │
│   Form Data     │    │   Endpoints      │    │  Service        │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌──────────────────┐    ┌─────────────────┐
                       │  Field Mapping   │    │  PDF Template   │
                       │  Configuration   │    │  (AcroForm)     │
                       └──────────────────┘    └─────────────────┘
```

## Files Structure

```
chrome-accountants-backend/
├── services/
│   ├── pdfFieldMapping.js      # Field mapping configuration
│   └── pdfFillerService.js     # PDF manipulation service
├── controllers/
│   └── pdfController.js        # HTTP endpoints
├── routes/
│   └── pdf.js                  # PDF routes
├── scripts/
│   └── enumeratePDFFields.js   # Dev utility
└── public/data/
    └── CA-Client-Contact-Form.pdf  # PDF template
```

## Field Mapping

### Text Fields
Database field names are mapped to PDF form field names in `services/pdfFieldMapping.js`:

```javascript
const PDF_FIELD_MAPPING = {
  'personalDetails.firstName': 'GIVEN NAMES',
  'personalDetails.lastName': 'LAST NAME',
  'contactInfo.email': 'EMAIL ADDRESS',
  // ... more mappings
};
```

### Checkbox Fields
Checkboxes are handled separately with their export values:

```javascript
const CHECKBOX_FIELD_MAPPING = {
  'personalDetails.title.MR': 'MR',
  'contactInfo.mobileAMPM.AM': 'MOBILE AM',
  // ... more checkbox mappings
};
```

### Date Fields
Special handling for date formatting (ISO to DD/MM/YYYY):

```javascript
const DATE_FIELDS = [
  'personalDetails.dateOfBirth',
  'eSignature.signatureDate'
];
```

## API Endpoints

### Generate PDF
```
GET /api/pdf/generate/:userId?flatten=true
POST /api/pdf/generate/:userId
```

**Parameters:**
- `userId`: User ID for the PDF
- `flatten` (query): `true` for read-only PDF, `false` for editable PDF
- `formData` (body): Client form data

**Response:**
- PDF file with appropriate headers
- PII-safe headers (no-store, no-cache)

### Enumerate Fields (Dev Utility)
```
GET /api/pdf/fields
```

**Response:**
```json
{
  "success": true,
  "fields": [
    {
      "name": "GIVEN NAMES",
      "type": "PDFTextField",
      "isReadOnly": false,
      "isRequired": true
    }
  ],
  "count": 25
}
```

### Test PDF Generation
```
POST /api/pdf/test?flatten=true
```

**Response:**
- PDF file with sample data for testing

## Usage Examples

### Basic PDF Generation
```javascript
const pdfFillerService = require('./services/pdfFillerService');

// Generate editable PDF
const pdfBytes = await pdfFillerService.generateFilledPDF(userId, formData, false);

// Generate read-only PDF
const pdfBytes = await pdfFillerService.generateFilledPDF(userId, formData, true);
```

### Field Enumeration (Dev)
```bash
# List all PDF fields
node scripts/enumeratePDFFields.js

# Or via API
curl http://localhost:3000/api/pdf/fields
```

## Field Types Handling

### Text Fields
- **Type**: `PDFTextField`
- **Mapping**: Direct value assignment
- **Special**: Date fields are formatted from ISO to DD/MM/YYYY

### Checkbox Fields
- **Type**: `PDFCheckBox`
- **Mapping**: Boolean values or specific export values
- **Special**: Title and AM/PM selections use specific export values

### Date Formatting
- **Input**: ISO format (YYYY-MM-DD)
- **Output**: DD/MM/YYYY format
- **Fields**: Date of birth, signature date

## Error Handling

The system includes comprehensive error handling:

- **Missing Fields**: Logs warnings but continues processing
- **Invalid Field Types**: Warns and skips invalid mappings
- **PDF Processing Errors**: Throws descriptive errors
- **File System Errors**: Handles template file access issues

## Security Features

### PII-Safe Headers
All PDF responses include security headers:
```
Cache-Control: no-store, no-cache, must-revalidate, proxy-revalidate
Pragma: no-cache
Expires: 0
Surrogate-Control: no-store
```

### Authentication
- Basic auth placeholder (to be wired with real auth)
- User ID validation
- Form data validation

## Development Workflow

### 1. Update Field Mapping
When PDF template changes:
1. Run field enumeration: `node scripts/enumeratePDFFields.js`
2. Update `services/pdfFieldMapping.js` with new fields
3. Test with sample data: `POST /api/pdf/test`

### 2. Add New Field Types
1. Add mapping to `PDF_FIELD_MAPPING` or `CHECKBOX_FIELD_MAPPING`
2. Update date formatting if needed in `DATE_FIELDS`
3. Test with real form data

### 3. Debugging
- Check console logs for field mapping warnings
- Use test endpoint to verify PDF generation
- Validate field names match PDF template exactly

## Testing

### Manual Testing
```bash
# Test field enumeration
curl http://localhost:3000/api/pdf/fields

# Test PDF generation with sample data
curl -X POST http://localhost:3000/api/pdf/test?flatten=true -o test.pdf

# Test with real form data
curl -X POST http://localhost:3000/api/pdf/generate/123 \
  -H "Content-Type: application/json" \
  -d '{"personalDetails": {"firstName": "John"}}' \
  -o client-form.pdf
```

### Integration Testing
- Test with complete form data from frontend
- Verify all fields are filled correctly
- Check PDF renders properly in different viewers
- Validate flattened vs editable PDFs

## Troubleshooting

### Common Issues

1. **Field Not Found**
   - Check field name spelling in mapping
   - Run field enumeration to verify available fields
   - Ensure PDF template is accessible

2. **Checkbox Not Working**
   - Verify export value matches PDF template
   - Check boolean value handling
   - Ensure checkbox field type in PDF

3. **Date Format Issues**
   - Verify date is in ISO format (YYYY-MM-DD)
   - Check date field is in `DATE_FIELDS` array
   - Test date formatting function

4. **PDF Generation Fails**
   - Check PDF template file exists and is readable
   - Verify pdf-lib library is installed
   - Check console logs for specific errors

### Debug Mode
Enable detailed logging by setting:
```javascript
process.env.DEBUG_PDF = 'true';
```

## Performance Considerations

- **Memory Usage**: PDF processing loads entire PDF into memory
- **File Size**: Large PDFs may impact performance
- **Concurrent Requests**: Consider rate limiting for high traffic
- **Caching**: Template PDF is read from disk on each request

## Future Enhancements

- [ ] PDF template caching
- [ ] Batch PDF generation
- [ ] PDF validation before sending
- [ ] Digital signature support
- [ ] PDF compression options
- [ ] Field validation against PDF schema

## Dependencies

- `pdf-lib`: PDF manipulation library
- `fs.promises`: File system operations
- `path`: File path utilities

## License

This system is part of the Chrome Accountants project.
