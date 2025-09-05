const { Router } = require('express');
const companiesRouter = require('./companies');
const usersRouter = require('./users');

const router = Router();

router.use('/companies', companiesRouter);
router.use('/users', usersRouter);

router.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

module.exports = router;


