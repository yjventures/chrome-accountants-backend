const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

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

const allowedUserUpdateFields = ['name', 'email', 'password', 'phone_number', 'address', 'company_id'];
const allowedAdminUpdateFields = ['name', 'email', 'password', 'phone_number', 'address', 'type', 'is_active', 'is_invited', 'email_verified', 'company_id'];

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

async function updatePasswordInitial({ email, currentPassword, newPassword }) {
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
    await user.save();
    return user.toObject();
  }
  const error = new Error('Password update not allowed');
  error.status = 400;
  throw error;
}

module.exports = { signup, login, updateUserById, deleteUserById, findUserById, updatePasswordInitial };


