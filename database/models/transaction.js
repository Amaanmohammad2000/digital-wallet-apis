module.exports = (sequelize, DataTypes) => {
  const transaction = sequelize.define(
    'transaction',
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      public_id: { type: DataTypes.UUID, unique: true, allowNull: false },
      wallet_id: { type: DataTypes.UUID, allowNull: false },
      counterparty_wallet_id: { type: DataTypes.UUID, allowNull: true },
      type: {
        type: DataTypes.ENUM('credit', 'debit', 'transfer_in', 'transfer_out', 'withdrawal'),
        allowNull: false,
      },
      amount: { type: DataTypes.DECIMAL(18, 2), allowNull: false },
      display_amount: { type: DataTypes.DECIMAL(18, 2), allowNull: false },
      currency: { type: DataTypes.STRING(3), allowNull: false },
      status: {
        type: DataTypes.ENUM('success', 'failed', 'flagged'),
        allowNull: false,
        defaultValue: 'success',
      },
      reference_id: { type: DataTypes.STRING, allowNull: false, unique: true },
      created_at: { allowNull: false, type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    },
    {
      freezeTableName: true,
      underscored: true,
      timestamps: false,
    }
  );

  transaction.associate = (models) => {
    transaction.belongsTo(models.wallet, { foreignKey: 'wallet_id', targetKey: 'public_id', as: 'wallet' });
    transaction.belongsTo(models.wallet, {
      foreignKey: 'counterparty_wallet_id',
      targetKey: 'public_id',
      as: 'counterpartyWallet',
    });
  };

  return transaction;
};
