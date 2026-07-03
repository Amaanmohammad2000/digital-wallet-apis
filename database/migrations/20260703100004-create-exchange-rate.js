module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('exchange_rate', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      base_currency: { type: Sequelize.STRING(3), allowNull: false },
      target_currency: { type: Sequelize.STRING(3), allowNull: false },
      rate: { type: Sequelize.DECIMAL(18, 8), allowNull: false },
      updated_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    });

    await queryInterface.addIndex('exchange_rate', ['base_currency', 'target_currency'], {
      unique: true,
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('exchange_rate');
  },
};
