const { Router } = require('express');
const controller = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');

const router = Router();

// Public
router.post('/signup', controller.signup);
router.post('/login', controller.login);
router.get('/verify-email', controller.verifyEmail);
// Unauthenticated initial password change for first login
router.post('/update-password-initial', controller.updatePasswordInitial);
// Password reset
router.post('/forgot-password', controller.forgotPassword);
router.post('/reset-password', controller.resetPassword);
// Login code verification
router.post('/verify-login-code', controller.verifyLoginCode);

// Authenticated user operations
router.get('/me', authenticate, controller.getCurrentUser);
router.patch('/me', authenticate, controller.patchSelf);
router.patch('/:id', authenticate, authorize('admin'), controller.updateUser);

// Authenticated password update (general case)
router.post('/update-password', authenticate, controller.patchSelf);

// Admin actions
router.get('/', authenticate, authorize('admin'), controller.list);
router.post('/invite', authenticate, authorize('admin'), controller.inviteUser);
router.patch('/:id', authenticate, authorize('admin'), controller.patchByAdmin);
router.delete('/:id', authenticate, authorize('admin'), controller.remove);

module.exports = router;


