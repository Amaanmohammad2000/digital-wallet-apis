module.exports = {
  up: async (queryInterface) => {
    const [existing] = await queryInterface.sequelize.query(
      "SELECT 1 FROM exchange_rate WHERE base_currency = 'INR' LIMIT 1"
    );
    if (existing.length > 0) return;

    const now = new Date();
    await queryInterface.bulkInsert('exchange_rate', [
      { base_currency: 'INR', target_currency: 'USD', rate: 0.01197, updated_at: now },
      { base_currency: 'INR', target_currency: 'EUR', rate: 0.01099, updated_at: now },
      { base_currency: 'INR', target_currency: 'GBP', rate: 0.00939, updated_at: now },
      { base_currency: 'INR', target_currency: 'AED', rate: 0.04396, updated_at: now },
      { base_currency: 'INR', target_currency: 'JPY', rate: 1.75, updated_at: now },
      { base_currency: 'INR', target_currency: 'AUD', rate: 0.0183, updated_at: now },
      { base_currency: 'INR', target_currency: 'SGD', rate: 0.01616, updated_at: now },
      { base_currency: 'INR', target_currency: 'CAD', rate: 0.01635, updated_at: now },
    ]);
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('exchange_rate', null, {});
  },
};
