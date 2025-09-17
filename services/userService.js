const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Company = require('../models/Company');

const SALT_ROUNDS = 10;

function generateToken(user) {
  const payload = { id: user._id, email: user.email, type: user.type };
  const secret = process.env.JWT_SECRET;
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  if (!secret) {
    throw new Error('JWT_SECRET is not set');
  }
  return jwt.sign(payload, secret, { expiresIn });
}

function generateEmailVerificationToken(user) {
  const payload = { id: user._id, email: user.email, purpose: 'verify_email' };
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not set');
  }
  return jwt.sign(payload, secret, { expiresIn: '2d' });
}

async function signup(payload) {
  const { name, email, password, type = 'client', phone_number, address, is_active, is_invited, company_id } = payload;

  const existing = await User.findOne({ email });
  if (existing) {
    const error = new Error('Email already in use');
    error.status = 409;
    throw error;
  }

  const hash = await bcrypt.hash(password, SALT_ROUNDS);
  const isClient = type !== 'admin';
  const effectiveIsActive = isClient ? false : is_active;
  const effectiveIsInvited = isClient ? true : is_invited;
  const user = await User.create({ name, email, password: hash, type, phone_number, address, is_active: effectiveIsActive, is_invited: effectiveIsInvited, company_id });
  const token = generateToken(user);
  return { user: user.toObject(), token };
}

async function login({ email, password }) {
  const user = await User.findOne({ email });
  if (!user) {
    const error = new Error('Invalid credentials');
    error.status = 401;
    throw error;
  }
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) {
    const error = new Error('Invalid credentials');
    error.status = 401;
    throw error;
  }
  const token = generateToken(user);
  return { user: user.toObject(), token };
}

const allowedUserUpdateFields = ['name', 'email', 'password', 'phone_number', 'address', 'company_id', 'company_name'];
const allowedAdminUpdateFields = ['name', 'email', 'password', 'phone_number', 'address', 'type', 'is_active', 'is_invited', 'email_verified', 'company_id', 'company_name'];

function filterAllowedFields(data, allowed) {
  return Object.keys(data || {})
    .filter((key) => allowed.includes(key))
    .reduce((obj, key) => {
      obj[key] = data[key];
      return obj;
    }, {});
}

async function updateUserById(id, updates, { asAdmin = false } = {}) {
  const allowed = asAdmin ? allowedAdminUpdateFields : allowedUserUpdateFields;
  const safe = filterAllowedFields(updates, allowed);
  if (safe.password) {
    safe.password = await bcrypt.hash(safe.password, SALT_ROUNDS);
  }
  return User.findByIdAndUpdate(id, safe, { new: true, runValidators: true }).lean();
}

async function deleteUserById(id) {
  return User.findByIdAndDelete(id);
}

async function findUserById(id) {
  return User.findById(id).lean();
}

async function updatePasswordInitial({ email, currentPassword, newPassword, profileData = {} }) {
  const user = await User.findOne({ email });
  if (!user) {
    const error = new Error('Invalid credentials');
    error.status = 401;
    throw error;
  }
  if (user.type !== 'admin' && user.is_active === false) {
    const ok = await bcrypt.compare(currentPassword, user.password);
    if (!ok) {
      const error = new Error('Invalid credentials');
      error.status = 401;
      throw error;
    }
    const hash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    user.password = hash;
    user.is_active = true;
    user.is_invited = false;
    
    // Update profile information if provided
    if (profileData.name) user.name = profileData.name;
    if (profileData.phone_number) user.phone_number = profileData.phone_number;
    if (profileData.address) user.address = profileData.address;
    
    await user.save();
    
    // Handle company name if provided
    if (profileData.company_name && profileData.company_name.trim()) {
      try {
        const companyData = {
          name: profileData.company_name.trim(),
          email: user.email,
          phone: user.phone_number || undefined,
          address: user.address || undefined,
        };
        const company = await Company.create(companyData);
        user.company_id = company._id;
        await user.save();
      } catch (err) {
        console.error('Error creating company:', err);
        // Don't fail the entire operation if company creation fails
      }
    }
    
    return user.toObject();
  }
  const error = new Error('Password update not allowed');
  error.status = 400;
  throw error;
}

async function listUsers() {
  try {
    const users = await User.find({}).select('-password').populate('company_id', 'name').lean();
    return users;
  } catch (error) {
    throw error;
  }
}

async function updateUserById(id, updates) {
  try {
    const user = await User.findByIdAndUpdate(id, updates, { new: true, runValidators: true }).select('-password').lean();
    return user;
  } catch (error) {
    throw error;
  }
}

async function updateCompanyName(companyId, newName) {
  try {
    const Company = require('../models/Company');
    const company = await Company.findByIdAndUpdate(companyId, { name: newName }, { new: true, runValidators: true });
    return company;
  } catch (error) {
    throw error;
  }
}

async function requestPasswordReset(email) {
  try {
    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if email exists or not for security
      return { message: 'If an account with that email exists, a password reset link has been sent.' };
    }

    // Generate reset token
    const resetToken = jwt.sign(
      { id: user._id, email: user.email, purpose: 'password_reset' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Store reset token in user document
    user.resetToken = resetToken;
    user.resetTokenExpires = new Date(Date.now() + 3600000); // 1 hour from now
    await user.save();

    return { message: 'If an account with that email exists, a password reset link has been sent.', resetToken };
  } catch (error) {
    throw error;
  }
}

async function resetPassword(token, newPassword) {
  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.purpose !== 'password_reset') {
      const error = new Error('Invalid token');
      error.status = 400;
      throw error;
    }

    // Find user and check if token is still valid
    const user = await User.findOne({ 
      _id: decoded.id, 
      resetToken: token,
      resetTokenExpires: { $gt: new Date() }
    });

    if (!user) {
      const error = new Error('Invalid or expired reset token');
      error.status = 400;
      throw error;
    }

    // Update password
    const hash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    user.password = hash;
    user.resetToken = undefined;
    user.resetTokenExpires = undefined;
    await user.save();

    return { message: 'Password has been reset successfully' };
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      const newError = new Error('Invalid or expired reset token');
      newError.status = 400;
      throw newError;
    }
    throw error;
  }
}

async function generateLoginCode(email) {
  try {
    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if email exists or not for security
      return { message: 'If an account with that email exists, a login code has been sent.' };
    }

    // Generate 6-digit login code
    const loginCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store login code in user document
    user.loginCode = loginCode;
    user.loginCodeExpires = new Date(Date.now() + 600000); // 10 minutes from now
    await user.save();

    return { message: 'Login code sent to your email', loginCode };
  } catch (error) {
    throw error;
  }
}

async function verifyLoginCode(email, code) {
  try {
    const user = await User.findOne({ 
      email, 
      loginCode: code,
      loginCodeExpires: { $gt: new Date() }
    });

    if (!user) {
      const error = new Error('Invalid or expired login code');
      error.status = 400;
      throw error;
    }

    // Clear the login code after successful verification
    user.loginCode = undefined;
    user.loginCodeExpires = undefined;
    await user.save();

    // Generate JWT token for login
    const token = jwt.sign(
      { id: user._id, email: user.email, type: user.type },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    return { 
      message: 'Login successful', 
      token, 
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        type: user.type,
        is_active: user.is_active,
        company_id: user.company_id
      } 
    };
  } catch (error) {
    throw error;
  }
}

async function createCompany(companyData) {
  try {
    const company = await Company.create(companyData);
    return company;
  } catch (error) {
    console.error('Error creating company:', error);
    throw error;
  }
}

module.exports = { signup, login, updateUserById, deleteUserById, findUserById, updatePasswordInitial, listUsers, updateCompanyName, createCompany, requestPasswordReset, resetPassword, generateLoginCode, verifyLoginCode };


