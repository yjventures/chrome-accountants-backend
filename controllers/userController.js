const userService = require('../services/userService');
const { sendEmailVerification } = require('../services/emailService');
const jwt = require('jsonwebtoken');

async function signup(req, res, next) {
  try {
    const { name, email, password, type, phone_number, address, is_active, is_invited, company_id } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ message: 'email and password are required' });
    }
    const effectiveType = type || 'client';
    if (effectiveType !== 'admin' && !company_id) {
      return res.status(400).json({ message: 'company_id is required for client users' });
    }
    const result = await userService.signup({ name, email, password, type, phone_number, address, is_active, is_invited, company_id });
    // send verification email for client users
    const userType = (result && result.user && result.user.type) || effectiveType;
    if (userType !== 'admin') {
      const token = jwt.sign({ id: result.user._id, email: result.user.email, purpose: 'verify_email' }, process.env.JWT_SECRET, { expiresIn: '2d' });
      await sendEmailVerification({ to: result.user.email, token });
    }
    return res.status(201).json(result);
  } catch (err) {
    return next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ message: 'email and password are required' });
    }
    const result = await userService.login({ email, password });
    // If client user has not activated yet, block login and ask to update password
    if (result && result.user && result.user.type !== 'admin' && result.user.is_active === false) {
      return res.status(403).json({ message: 'Please update your password to login' });
    }
    return res.json(result);
  } catch (err) {
    return next(err);
  }
}

async function patchSelf(req, res, next) {
  try {
    const userId = req.user.id;
    const existing = await userService.findUserById(userId);
    if (!existing) {
      return res.status(404).json({ message: 'User not found' });
    }
    const resultingType = (req.body && req.body.type) ? req.body.type : existing.type;
    const resultingCompanyId = (req.body && Object.prototype.hasOwnProperty.call(req.body, 'company_id')) ? req.body.company_id : existing.company_id;
    if (resultingType !== 'admin' && !resultingCompanyId) {
      return res.status(400).json({ message: 'company_id is required for client users' });
    }
    const updated = await userService.updateUserById(userId, req.body || {}, { asAdmin: false });
    if (!updated) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.json(updated);
  } catch (err) {
    return next(err);
  }
}

async function patchByAdmin(req, res, next) {
  try {
    const { id } = req.params;
    const existing = await userService.findUserById(id);
    if (!existing) {
      return res.status(404).json({ message: 'User not found' });
    }
    const resultingType = (req.body && req.body.type) ? req.body.type : existing.type;
    const resultingCompanyId = (req.body && Object.prototype.hasOwnProperty.call(req.body, 'company_id')) ? req.body.company_id : existing.company_id;
    if (resultingType !== 'admin' && !resultingCompanyId) {
      return res.status(400).json({ message: 'company_id is required for client users' });
    }
    const updated = await userService.updateUserById(id, req.body || {}, { asAdmin: true });
    if (!updated) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.json(updated);
  } catch (err) {
    return next(err);
  }
}

async function remove(req, res, next) {
  try {
    const { id } = req.params;
    const deleted = await userService.deleteUserById(id);
    if (!deleted) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.json({ status: 'success', message: `User with id: ${id} has been deleted` });
  } catch (err) {
    return next(err);
  }
}

async function verifyEmail(req, res, next) {
  try {
    const { token } = req.query || {};
    if (!token) {
      return res.status(400).json({ message: 'Missing token' });
    }
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (!payload || payload.purpose !== 'verify_email') {
      return res.status(400).json({ message: 'Invalid token' });
    }
    const updated = await userService.updateUserById(payload.id, { email_verified: true }, { asAdmin: true });
    if (!updated) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.json({ status: 'success', message: 'Email verified' });
  } catch (err) {
    return next(err);
  }
}

async function updatePasswordInitial(req, res, next) {
  try {
    const { email, currentPassword, newPassword } = req.body || {};
    if (!email || !currentPassword || !newPassword) {
      return res.status(400).json({ message: 'email, currentPassword and newPassword are required' });
    }
    const user = await userService.updatePasswordInitial({ email, currentPassword, newPassword });
    return res.json({ status: 'success', message: 'Password updated. You may now login.', user });
  } catch (err) {
    return next(err);
  }
}

module.exports = { signup, login, patchSelf, patchByAdmin, remove, verifyEmail, updatePasswordInitial };


