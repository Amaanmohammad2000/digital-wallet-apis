module.exports = (sequelize, DataTypes) => {
  const user = sequelize.define(
    'user',
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      public_id: { type: DataTypes.UUID, unique: true, allowNull: false },
      name: { type: DataTypes.STRING, allowNull: false },
      email: { type: DataTypes.STRING, allowNull: false, unique: true },
      phone_number: { type: DataTypes.STRING(15), allowNull: false, unique: true },
      password_hash: { type: DataTypes.STRING, allowNull: false },
      default_currency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'INR' },
      status: {
        type: DataTypes.STRING,
        defaultValue: 'active',
      },
      created_at: { allowNull: false, type: DataTypes.DATE, defaultValue: DataTypes.NOW },
      updated_at: { allowNull: false, type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    },
    {
      freezeTableName: true,
      underscored: true,
      timestamps: true,
    }
  );

  user.associate = (models) => {
    user.hasOne(models.wallet, { foreignKey: 'user_id', sourceKey: 'public_id' });
  };

  return user;
};
