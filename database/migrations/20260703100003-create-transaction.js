module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('transaction', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      public_id: { type: Sequelize.UUID, unique: true, allowNull: false },
      wallet_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'wallet', key: 'public_id' },
        onDelete: 'CASCADE',
      },
      counterparty_wallet_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'wallet', key: 'public_id' },
        onDelete: 'SET NULL',
      },
      type: {
        type: Sequelize.ENUM('credit', 'debit', 'transfer_in', 'transfer_out', 'withdrawal'),
        allowNull: false,
      },
      amount: { type: Sequelize.DECIMAL(18, 2), allowNull: false },
      display_amount: { type: Sequelize.DECIMAL(18, 2), allowNull: false },
      currency: { type: Sequelize.STRING(3), allowNull: false },
      status: {
        type: Sequelize.ENUM('success', 'failed', 'flagged'),
        allowNull: false,
        defaultValue: 'success',
      },
      reference_id: { type: Sequelize.STRING, allowNull: false, unique: true },
      created_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    });

    await queryInterface.addIndex('transaction', ['wallet_id']);
    await queryInterface.addIndex('transaction', ['created_at']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('transaction');
  },
};
