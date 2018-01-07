module.exports = function(sequelize, Sequelize) {
	var type_utilisateur = sequelize.define('type_utilisateur', {
	id_type_utilisateur: {
	  type: Sequelize.INTEGER,
	  primaryKey: true,
	  autoIncrement: true
	},
	libelle: {
		type: Sequelize.STRING
	}
	}, {
	tableName: 'type_utilisateur'
	});
	return type_utilisateur;
}
