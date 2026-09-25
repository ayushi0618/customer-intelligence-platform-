/**
 * Customer Service
 */

const customerRepository = require('../repositories/customer.repository');

class CustomerService {
  async getCustomers(query) {
    const page = Math.max(1, parseInt(query.page || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(query.limit || '25', 10)));
    const search = (query.search || '').trim();
    const segment = (query.segment || '').trim();
    const churnRisk = (query.churnRisk || '').trim();
    const channel = (query.channel || '').trim();
    const minSpend = parseFloat(query.minSpend || '0');
    const sortBy = query.sortBy || 'registration_date';
    const sortOrder = query.sortOrder || 'DESC';

    return await customerRepository.findAll({
      page,
      limit,
      search,
      segment,
      churnRisk,
      channel,
      minSpend,
      sortBy,
      sortOrder
    });
  }

  async getCustomerById(id) {
    const customer = await customerRepository.findById(id);
    if (!customer) {
      const err = new Error(`Customer with ID ${id} not found.`);
      err.statusCode = 404;
      err.code = 'CUSTOMER_NOT_FOUND';
      throw err;
    }
    return customer;
  }

  async getCustomer360(id) {
    const profile360 = await customerRepository.getCustomer360(id);
    if (!profile360) {
      const err = new Error(`Customer with ID ${id} not found.`);
      err.statusCode = 404;
      err.code = 'CUSTOMER_NOT_FOUND';
      throw err;
    }
    return profile360;
  }

  async getCustomerJourney(id) {
    const customer = await customerRepository.findById(id);
    if (!customer) {
      const err = new Error(`Customer with ID ${id} not found.`);
      err.statusCode = 404;
      err.code = 'CUSTOMER_NOT_FOUND';
      throw err;
    }
    const timeline = await customerRepository.getCustomerJourney(id);
    return {
      customerId: parseInt(id, 10),
      customerName: `${customer.first_name} ${customer.last_name}`,
      timeline
    };
  }
}

module.exports = new CustomerService();
