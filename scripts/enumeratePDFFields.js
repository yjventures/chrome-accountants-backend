#!/usr/bin/env node

/**
 * Dev Utility: Enumerate PDF Form Fields
 * 
 * This script reads the PDF template and lists all available form fields
 * with their types and properties. Use this to maintain accurate field mapping.
 * 
 * Usage: node scripts/enumeratePDFFields.js
 */

const pdfFillerService = require('../services/pdfFillerService');

async function main() {
  try {
    console.log('🔍 Enumerating PDF form fields...\n');
    
    const fieldInfo = await pdfFillerService.enumeratePDFFields();
    
    console.log(`\n📊 Summary:`);
    console.log(`Total fields: ${fieldInfo.length}`);
    
    const fieldTypes = fieldInfo.reduce((acc, field) => {
      acc[field.type] = (acc[field.type] || 0) + 1;
      return acc;
    }, {});
    
    console.log('\n📋 Field types:');
    Object.entries(fieldTypes).forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });
    
    console.log('\n✅ Field enumeration complete!');
    console.log('\n💡 Use this information to update the field mapping in services/pdfFieldMapping.js');
    
  } catch (error) {
    console.error('❌ Error enumerating PDF fields:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = main;
