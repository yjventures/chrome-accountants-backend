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

// Authenticated user updates self
router.patch('/me', authenticate, controller.patchSelf);

// Authenticated password update (general case)
router.post('/update-password', authenticate, controller.patchSelf);

// Admin actions
router.patch('/:id', authenticate, authorize('admin'), controller.patchByAdmin);
router.delete('/:id', authenticate, authorize('admin'), controller.remove);

module.exports = router;


