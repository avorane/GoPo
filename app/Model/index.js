const Sequelize = require('sequelize');
const sequelize = new Sequelize('gopo', 'toto', 'GoPo2016', {
	host: 'localhost',
	dialect: 'mysql'
});
var database = {};
var utilisateur = sequelize.import(__dirname + '/User.js');
var zone = sequelize.import(__dirname + '/Zone.js');
database['utilisateur'] = utilisateur;
database['zone'] = zone;
database.sequelize = sequelize;
database.Sequelize = Sequelize;

module.exports = database;