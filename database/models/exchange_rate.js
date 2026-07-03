module.exports = (sequelize, DataTypes) => {
  const exchange_rate = sequelize.define(
    'exchange_rate',
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      base_currency: { type: DataTypes.STRING(3), allowNull: false },
      target_currency: { type: DataTypes.STRING(3), allowNull: false },
      rate: { type: DataTypes.DECIMAL(18, 8), allowNull: false },
      updated_at: { allowNull: false, type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    },
    {
      freezeTableName: true,
      underscored: true,
      timestamps: false,
      indexes: [{ unique: true, fields: ['base_currency', 'target_currency'] }],
    }
  );

  return exchange_rate;
};
