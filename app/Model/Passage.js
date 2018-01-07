module.exports = function(sequelize, Sequelize) {
	var passage = sequelize.define('passage', {
	id_passage: {
	  type: Sequelize.INTEGER,
	  primaryKey: true,
	  autoIncrement: true
	},
	id_utilisateur_proprietaire: {
		type: Sequelize.INTEGER,
		references: {
			model: "utilisateur",
			key: "id_utilisateur"
		}
	},
	id_utilisateur_passe: {
		type: Sequelize.INTEGER,
		references: {
			model: "utilisateur",
			key: "id_utilisateur"
		}
	},
	id_zone: {
		type: Sequelize.INTEGER,
		references: {
			model: "zone",
			key: "id_zone"
		}
	},
	date_passage: {
		type: Sequelize.DATE
	}
	}, {
	tableName: 'passage'
	});
	return passage;
}