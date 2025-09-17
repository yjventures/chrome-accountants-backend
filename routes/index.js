const { Router } = require('express');
const companiesRouter = require('./companies');
const usersRouter = require('./users');
const formsRouter = require('./forms');
const pdfRouter = require('./pdf');

const router = Router();

router.use('/companies', companiesRouter);
router.use('/users', usersRouter);
router.use('/forms', formsRouter);
router.use('/pdf', pdfRouter);

router.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

module.exports = router;


