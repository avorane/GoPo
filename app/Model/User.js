module.exports = function(sequelize, Sequelize) {
	var utilisateur = sequelize.define('utilisateur', {
	id_utilisateur: {
	  type: Sequelize.INTEGER,
	  primaryKey: true,
	  autoIncrement: true
	},
	nom: {
	  type: Sequelize.STRING
	},
	prenom: {
	  type:Sequelize.STRING
	},
	pseudo: {
		type: Sequelize.STRING
	},
	mot_de_passe: {
		type: Sequelize.STRING
	},
	credit: {
		type: Sequelize.INTEGER
	},
	id_type_utilisateur: {
		type: Sequelize.INTEGER,
		references: {
			model: "type_utilisateur",
			key: "id_type_utilisateur"
		}
	}
	}, {
	tableName: 'utilisateur'
	});
	return utilisateur;
}
