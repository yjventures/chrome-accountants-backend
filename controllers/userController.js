const userService = require('../services/userService');
const { sendEmailVerification, sendInvitationEmail } = require('../services/emailService');
const jwt = require('jsonwebtoken');

async function signup(req, res, next) {
  try {
    const { name, email, password, type, phone_number, address, is_active, is_invited, company_id } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ message: 'email and password are required' });
    }
    const effectiveType = type || 'client';
    // company_id is optional for client users
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

async function getCurrentUser(req, res, next) {
  try {
    const userId = req.user.id;
    const user = await userService.findUserById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.json({ data: user });
  } catch (err) {
    return next(err);
  }
}

async function updateUser(req, res, next) {
  try {
    const { id } = req.params;
    const updates = req.body || {};
    
    // Only allow updating specific fields for security
    const allowedFields = ['name', 'email', 'phone_number', 'address', 'is_active', 'company_name'];
    const filteredUpdates = {};
    
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        filteredUpdates[field] = updates[field];
      }
    }
    
    // Handle company name update
    if (updates.company_name !== undefined) {
      console.log('Updating company name for user:', id, 'to:', updates.company_name);
      const user = await userService.findUserById(id);
      console.log('User found:', user);
      
      if (user && user.company_id) {
        // User has a company, update the company name
        console.log('Updating company:', user.company_id, 'with name:', updates.company_name);
        const updatedCompany = await userService.updateCompanyName(user.company_id, updates.company_name);
        console.log('Company updated:', updatedCompany);
      } else if (updates.company_name && updates.company_name.trim()) {
        // User doesn't have a company but wants to add one, create a new company
        console.log('Creating new company for user:', updates.company_name);
        const companyData = {
          name: updates.company_name.trim(),
          email: user.email,
          phone: user.phone_number || undefined,
          address: user.address || undefined,
        };
        const companyRes = await userService.createCompany(companyData);
        if (companyRes) {
          // Update user with the new company_id
          filteredUpdates.company_id = companyRes._id;
          console.log('Created company and linked to user:', companyRes._id);
        }
      } else if (updates.company_name === '' || updates.company_name === null) {
        // User wants to remove company association
        console.log('Removing company association for user');
        filteredUpdates.company_id = null;
      }
      
      // Remove company_name from user updates since it's handled separately
      delete filteredUpdates.company_name;
    }
    
    const user = await userService.updateUserById(id, filteredUpdates);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.json({ data: user });
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
    
    const updates = req.body || {};
    
    // Handle company name update
    if (updates.company_name) {
      console.log('Updating company name for user:', userId, 'to:', updates.company_name);
      if (existing.company_id) {
        console.log('Updating company:', existing.company_id, 'with name:', updates.company_name);
        // Update the company name
        const updatedCompany = await userService.updateCompanyName(existing.company_id, updates.company_name);
        console.log('Company updated:', updatedCompany);
      } else if (updates.company_name.trim()) {
        // User doesn't have a company but wants to add one, create a new company
        console.log('Creating new company for user:', updates.company_name);
        const companyData = {
          name: updates.company_name.trim(),
          email: existing.email,
          phone: existing.phone_number || undefined,
          address: existing.address || undefined,
        };
        const companyRes = await userService.createCompany(companyData);
        if (companyRes) {
          // Update user with the new company_id
          updates.company_id = companyRes._id;
          console.log('Created company and linked to user:', companyRes._id);
        }
      }
      // Remove company_name from user updates since it's handled separately
      delete updates.company_name;
    }
    
    const updated = await userService.updateUserById(userId, updates, { asAdmin: false });
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
    // company_id is optional for client users
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
    const { email, currentPassword, newPassword, name, phone_number, address, company_name } = req.body || {};
    if (!email || !currentPassword || !newPassword) {
      return res.status(400).json({ message: 'email, currentPassword and newPassword are required' });
    }
    
    const profileData = {};
    if (name) profileData.name = name;
    if (phone_number) profileData.phone_number = phone_number;
    if (address) profileData.address = address;
    if (company_name) profileData.company_name = company_name;
    
    const user = await userService.updatePasswordInitial({ email, currentPassword, newPassword, profileData });
    return res.json({ status: 'success', message: 'Password updated. You may now login.', user });
  } catch (err) {
    return next(err);
  }
}

async function inviteUser(req, res, next) {
  try {
    const { email, role } = req.body || {};
    if (!email || !role) {
      return res.status(400).json({ message: 'email and role are required' });
    }

    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-8) + 'Temp@123';
    
    // Create user account
    const nameParts = email.split('@')[0].split('.');
    const result = await userService.signup({
      name: nameParts.map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' '),
      email,
      password: tempPassword,
      type: role,
      is_active: true,
      is_invited: true
    });

    if (result && result.user) {
      // Send invitation email
      await sendInvitationEmail({
        to: email,
        role: role,
        tempPassword: tempPassword,
        adminName: req.user?.name || 'Admin'
      });

      return res.status(201).json({
        message: 'Invitation sent successfully',
        user: {
          email: result.user.email,
          type: result.user.type,
          is_invited: result.user.is_invited
        }
      });
    } else {
      return res.status(500).json({ message: 'Failed to create user account' });
    }
  } catch (err) {
    return next(err);
  }
}

async function list(req, res, next) {
  try {
    const users = await userService.listUsers();
    return res.json(users);
  } catch (err) {
    return next(err);
  }
}

async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body || {};
    if (!email) {
      return res.status(400).json({ message: 'email is required' });
    }
    const result = await userService.generateLoginCode(email);
    
    // If user exists, send the login code via email
    if (result.loginCode) {
      const { sendLoginCodeEmail } = require('../services/emailService');
      await sendLoginCodeEmail({ to: email, loginCode: result.loginCode });
    }
    
    return res.json({ message: result.message });
  } catch (err) {
    return next(err);
  }
}

async function resetPassword(req, res, next) {
  try {
    const { token, newPassword } = req.body || {};
    if (!token || !newPassword) {
      return res.status(400).json({ message: 'token and newPassword are required' });
    }
    const result = await userService.resetPassword(token, newPassword);
    return res.json({ message: 'Password reset successfully' });
  } catch (err) {
    return next(err);
  }
}

async function verifyLoginCode(req, res, next) {
  try {
    const { email, code } = req.body || {};
    if (!email || !code) {
      return res.status(400).json({ message: 'email and code are required' });
    }
    const result = await userService.verifyLoginCode(email, code);
    return res.json(result);
  } catch (err) {
    return next(err);
  }
}

module.exports = { signup, login, getCurrentUser, updateUser, patchSelf, patchByAdmin, remove, verifyEmail, updatePasswordInitial, inviteUser, list, forgotPassword, resetPassword, verifyLoginCode };


