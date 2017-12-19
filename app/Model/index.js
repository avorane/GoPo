const Sequelize = require('sequelize');
const sequelize = new Sequelize('gopo', 'toto', 'GoPo2016', {
	host: 'localhost',
	dialect: 'mysql'
});
var database = {};
database['utilisateur'] = sequelize.import(__dirname + '/User.js');
database.sequelize = sequelize;
database.Sequelize = Sequelize;

module.exports = database;