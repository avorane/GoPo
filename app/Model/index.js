const Sequelize = require('sequelize');
const sequelize = new Sequelize('gopo', 'toto', 'GoPo2016', {
	host: 'localhost',
	dialect: 'mysql'
});
var database = {};
var utilisateur = sequelize.import(__dirname + '/User.js');
var zone = sequelize.import(__dirname + '/Zone.js');
var passage = sequelize.import(__dirname + '/Passage.js');
var type_utilisateur = sequelize.import(__dirname + '/TypeUtilisateur.js');
database['utilisateur'] = utilisateur;
database['zone'] = zone;
database['passage'] = passage;
database['type_utilisateur'] = type_utilisateur;
database.sequelize = sequelize;
database.Sequelize = Sequelize;

module.exports = database;