module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('wallet', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      public_id: { type: Sequelize.UUID, unique: true, allowNull: false },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
        references: { model: 'user', key: 'public_id' },
        onDelete: 'CASCADE',
      },
      balance: { type: Sequelize.DECIMAL(18, 2), allowNull: false, defaultValue: 0 },
      currency: { type: Sequelize.STRING(3), allowNull: false, defaultValue: 'INR' },
      daily_limit: { type: Sequelize.DECIMAL(18, 2), allowNull: false, defaultValue: 500000 },
      created_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      updated_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('wallet');
  },
};
