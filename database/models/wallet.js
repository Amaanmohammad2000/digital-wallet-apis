module.exports = (sequelize, DataTypes) => {
  const wallet = sequelize.define(
    'wallet',
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      public_id: { type: DataTypes.UUID, unique: true, allowNull: false },
      user_id: { type: DataTypes.UUID, allowNull: false, unique: true },
      balance: { type: DataTypes.DECIMAL(18, 2), allowNull: false, defaultValue: 0 },
      currency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'INR' },
      daily_limit: { type: DataTypes.DECIMAL(18, 2), allowNull: false, defaultValue: 500000 },
      created_at: { allowNull: false, type: DataTypes.DATE, defaultValue: DataTypes.NOW },
      updated_at: { allowNull: false, type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    },
    {
      freezeTableName: true,
      underscored: true,
      timestamps: true,
    }
  );

  wallet.associate = (models) => {
    wallet.belongsTo(models.user, { foreignKey: 'user_id', targetKey: 'public_id' });
    wallet.hasMany(models.transaction, { foreignKey: 'wallet_id', sourceKey: 'public_id' });
  };

  return wallet;
};
