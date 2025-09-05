const companyService = require('../services/companyService');

async function create(req, res, next) {
  try {
    const { name, address, phone, email, description } = req.body || {};
    if (!name) {
      return res.status(400).json({ message: 'name is required' });
    }
    const company = await companyService.createCompany({ name, address, phone, email, description });
    return res.status(201).json(company);
  } catch (err) {
    return next(err);
  }
}

async function list(req, res, next) {
  try {
    const { search, sortBy, sortType } = req.query || {};
    const companies = await companyService.listCompanies({ search, sortBy, sortType });
    return res.json(companies);
  } catch (err) {
    return next(err);
  }
}

async function getById(req, res, next) {
  try {
    const { id } = req.params;
    const company = await companyService.getCompanyById(id);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }
    return res.json(company);
  } catch (err) {
    return next(err);
  }
}

async function update(req, res, next) {
  try {
    const { id } = req.params;
    const company = await companyService.updateCompanyById(id, req.body || {});
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }
    return res.json(company);
  } catch (err) {
    return next(err);
  }
}

async function remove(req, res, next) {
  try {
    const { id } = req.params;
    const deleted = await companyService.deleteCompanyById(id);
    if (!deleted) {
      return res.status(404).json({ message: 'Company not found' });
    }
    return res.json({ status: 'success', message: `Company with id: ${id} has been deleted` });
  } catch (err) {
    return next(err);
  }
}

module.exports = { create, list, getById, update, remove };


