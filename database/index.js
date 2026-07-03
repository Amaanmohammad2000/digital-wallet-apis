const { Sequelize } = require('sequelize');
const config = require('./config/config');
const modelLoader = require('./models');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, dbConfig);

const database = modelLoader(sequelize);
database.sequelize = sequelize;
database.Sequelize = Sequelize;
database.authenticate = () => sequelize.authenticate();

module.exports = database;
