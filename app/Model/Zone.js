module.exports = function(sequelize, Sequelize) {
	var zone = sequelize.define('zone', {
	id_zone: {
	  type: Sequelize.INTEGER,
	  primaryKey: true,
	  autoIncrement: true
	},
	longitude: {
	  type: Sequelize.FLOAT
	},
	latitude: {
	  type:Sequelize.FLOAT
	},
	valeur: {
		type: Sequelize.INTEGER
	},
	libelle: {
		type: Sequelize.STRING
	},
	description: {
		type: Sequelize.STRING
	},
	path_image: {
		type: Sequelize.STRING
	},
	gain: {
		type: Sequelize.INTEGER
	},
	rayon: {
		type: Sequelize.INTEGER
	},
	isActif: {
		type: Sequelize.INTEGER
	},
	dateCreation: {
		type: Sequelize.DATE
	},
	id_utilisateur: {
		type: Sequelize.INTEGER,
		references: {
			model: "utilisateur",
			key: "id_utilisateur"
		}
	}
	}, {
	tableName: 'zone'
	});
	return zone;
}
