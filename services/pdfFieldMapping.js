/**
 * PDF Field Mapping Configuration
 * Maps database field names to PDF form field names
 */

const PDF_FIELD_MAPPING = {
  // Personal Details
  'personalDetails.firstName': 'GIVEN NAMES',
  'personalDetails.lastName': 'LAST NAME',
  'personalDetails.dateOfBirth': 'DATE OF BIRTH',
  'personalDetails.ssn': 'TAX FILE NUMBER',
  
  // Contact Information
  'contactInfo.email': 'EMAIL ADDRESS',
  'contactInfo.mobilePhone': 'PREFERRED PHONE NUMBER to contact you on mobile typically allows fastest contact time',
  'contactInfo.homeExtension': 'undefined',
  'contactInfo.homePhone': 'undefined_2',
  'contactInfo.workExtension': 'undefined_3',
  'contactInfo.workPhone': 'undefined_4',
  'contactInfo.mobileTime': 'AM  PM',
  'contactInfo.homeTime': 'AM  PM_2',
  'contactInfo.workTime': 'AM  PM_3',
  
  // Spouse/Partner Details
  'spouseDetails.firstName': 'GIVEN NAMES_2',
  'spouseDetails.lastName': 'LAST NAME_2',
  'spouseDetails.email': 'EMAIL ADDRESS_2',
  'spouseDetails.mobilePhone': 'PREFERRED PHONE NUMBER',
  'spouseDetails.homeExtension': 'undefined_5',
  'spouseDetails.homePhone': 'undefined_6',
  'spouseDetails.workExtension': 'undefined_7',
  'spouseDetails.workPhone': 'undefined_8',
  'spouseDetails.mobileTime': 'AM  PM_4',
  'spouseDetails.homeTime': 'AM  PM_5',
  'spouseDetails.workTime': 'AM  PM_6',
  
  // Address Details
  'addressDetails.residentialAddress': 'RESIDENTIAL ADDRESS 1',
  'addressDetails.residentialAddress2': 'RESIDENTIAL ADDRESS 2',
  'addressDetails.residentialCity': 'SUBURB',
  'addressDetails.residentialState': 'STATE',
  'addressDetails.residentialZip': 'POSTCODE',
  'addressDetails.postalAddress': 'POSTAL ADDRESS if different from residential 1',
  'addressDetails.postalAddress2': 'POSTAL ADDRESS if different from residential 2',
  'addressDetails.postalCity': 'SUBURB_2',
  'addressDetails.postalState': 'STATE_2',
  'addressDetails.postalZip': 'POSTCODE_2',
  
  // Banking Details
  'bankingDetails.bankName': 'ACCOUNT NAME',
  'bankingDetails.accountNumber': 'ACCOUNT NUMBER',
  'bankingDetails.routingNumber': 'BSB',
  
  // Additional Information
  'additionalInfo.occupation': 'If you are a new client how did you hear about us',
  
  // E-Signature
  'eSignature.signatureDate': 'DATE',
  'eSignature.signature': 'SIGNATURE'
};

// Checkbox field mappings with their export values
const CHECKBOX_FIELD_MAPPING = {
  // Title checkboxes (Check Box8-13)
  'personalDetails.title.MR': 'Check Box3.0',
  'personalDetails.title.MRS': 'Check Box3.1',
  'personalDetails.title.MS': 'Check Box13.2',
  'personalDetails.title.MISS': 'Check Box3.3',
  'personalDetails.title.DR': 'Check Box3.4',
  'personalDetails.title.OTHER': 'Check Box3.5',
  
  // Spouse title checkboxes (Check Box3.0-3.5)
  'spouseDetails.title.MR': 'Check Box4.0',
  'spouseDetails.title.MRS': 'Check Box4.1',
  'spouseDetails.title.MS': 'Check Box4.2',
  'spouseDetails.title.MISS': 'Check Box4.3',
  'spouseDetails.title.DR': 'Check Box4.4',
  'spouseDetails.title.OTHER': 'Check Box4.5',
  
  // Phone selection checkboxes
  'contactInfo.selectedPhones.mobile': 'Check Box13',
  'contactInfo.selectedPhones.home': 'Check Box8', 
  'contactInfo.selectedPhones.work': 'Check Box9',
  
  'spouseDetails.selectedPhones.mobile': 'Check Box12',
  'spouseDetails.selectedPhones.home': 'Check Box10',
  'spouseDetails.selectedPhones.work': 'Check Box11',
  
  // Postal address different checkbox - removed to avoid conflict with title checkboxes
  // 'addressDetails.postalDifferent': 'Check Box8',
  
  //Consent checkbox - removed to avoid conflict with title checkboxes
  'additionalInfo.consentGiven': 'Check Box4.0'
};

// Date fields that need formatting from ISO to DD/MM/YYYY
const DATE_FIELDS = [
  'personalDetails.dateOfBirth',
  'eSignature.signatureDate'
];

module.exports = {
  PDF_FIELD_MAPPING,
  CHECKBOX_FIELD_MAPPING,
  DATE_FIELDS
};
