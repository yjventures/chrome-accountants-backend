const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    type: { type: String, enum: ['client', 'admin'], required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    phone_number: { type: String, trim: true },
    address: { type: String, trim: true },
    is_active: { type: Boolean, default: true },
    is_invited: { type: Boolean, default: false },
    email_verified: { type: Boolean, default: false },
    company_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', UserSchema);


