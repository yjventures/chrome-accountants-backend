const Company = require('../models/Company');

const allowedUpdateFields = ['name', 'address', 'phone', 'email', 'description'];

function filterAllowedFields(data, allowed) {
  return Object.keys(data || {})
    .filter((key) => allowed.includes(key))
    .reduce((obj, key) => {
      obj[key] = data[key];
      return obj;
    }, {});
}

async function createCompany(payload) {
  return Company.create(payload);
}

async function listCompanies(options = {}) {
  const { search, sortBy, sortType } = options;

  const filter = {};
  if (search && String(search).trim().length > 0) {
    const value = String(search).trim();
    const regex = new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ name: regex }, { email: regex }, { phone: regex }];
  }

  const normalizedSortBy = (sortBy || '').toString().toLowerCase();
  const sortField = normalizedSortBy === 'name' ? 'name' : 'createdAt';

  const normalizedSortType = (sortType || '').toString().toLowerCase();
  const isAsc = normalizedSortType === 'asc';
  const isDesc = normalizedSortType === 'desc' || normalizedSortType === 'dec' || normalizedSortType === 'descending';
  const order = isAsc ? 1 : isDesc ? -1 : -1; // default desc

  return Company.find(filter).sort({ [sortField]: order }).lean();
}

async function getCompanyById(id) {
  return Company.findById(id).lean();
}

async function updateCompanyById(id, updates) {
  const safeUpdates = filterAllowedFields(updates, allowedUpdateFields);
  return Company.findByIdAndUpdate(id, safeUpdates, { new: true, runValidators: true }).lean();
}

async function deleteCompanyById(id) {
  return Company.findByIdAndDelete(id);
}

module.exports = {
  createCompany,
  listCompanies,
  getCompanyById,
  updateCompanyById,
  deleteCompanyById
};


