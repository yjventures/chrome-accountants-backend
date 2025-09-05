const { Router } = require('express');
const companiesRouter = require('./companies');

const router = Router();

router.use('/companies', companiesRouter);

router.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

module.exports = router;


