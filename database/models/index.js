const fs = require('fs');
const path = require('path');

const basename = path.basename(__filename);
const db = {};

module.exports = (sequelize) => {
  fs.readdirSync(__dirname)
    .filter((file) => file.indexOf('.') !== 0 && file !== basename && file.slice(-3) === '.js')
    .forEach((file) => {
      const modelDefiner = require(path.join(__dirname, file));
      const model = modelDefiner(sequelize, require('sequelize').DataTypes);
      db[model.name] = model;
    });

  Object.keys(db).forEach((modelName) => {
    if (db[modelName].associate) {
      db[modelName].associate(db);
    }
  });

  return db;
};
