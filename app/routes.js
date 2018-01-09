module.exports = function(app, passport, model, io) {
	
	//imports
	var formidable = require('formidable');
	var fs = require('fs');
	var path = require('path');

	//deux tableaux servant à stocker des données de présences des joueurs dans une zone pour ne pas créditer chaque seconde le propriétaire
    var locked_zones_utilisateur = {};
    var zone_utilisateur_present = {};
    
    //variable qui stocke l'id d'une zone créée pour renommer des fichiers uploadés avec l'id de la zone
    var id_zone_added = 0;

    // =====================================
    // Partie utilisateur ========
    // =====================================
    
    //accès à la page de login
    app.get('/login', function(req, res, next) {
        res.sendFile(__dirname + '/View/login.html');
    });
    
    //redirection de l'utilisateur après validation du login selon son type utilisateur (1 = admin, 2 = simple utilisateur)
    app.post('/login', function(req, res, next) {
    	//passport utilise la règle de signin définie dans le fichier passport.js
        passport.authenticate('local-signin', function(err, user, info) {
            if (err) { 
                return next(err); 
            }
            if (!user) { 
                return res.redirect('/login'); 
            }
            req.logIn(user, function(err) {
              if (err) { 
                return next(err); 
              }
              if (user.type_utilisateur == 1) {
                return res.redirect('/admin');
              } else if (user.type_utilisateur == 2) {
                return res.redirect('/');
              }
            });
        })(req, res, next);
    });
    
    //un utilisateur créé un compte
    app.post('/signup', function(req, res, next) {
        passport.authenticate('local-signup', function(err, user, info) {
            if (err) { 
                return next(err); 
            }
            if (!user) { 
                return res.redirect('/login'); 
            }
            req.logIn(user, function(err) {
              if (err) { 
                return next(err); 
              }
              res.json({resirect: 'index'});
            });
       })(req, res, next);
    });
    
    //on ferme la session
    app.post('/logout', function(req, res, next) {
        req.logout();
        res.send(200);
    });
    
    //on se connecte ne admin so on a les droits
    app.get('/admin', isLogged, function(req, res, next) {
    	if (req.user.type_utilisateur == 1) {
    		res.sendFile(__dirname + '/View/admin.html');
    	} else {
    		res.status(401);
    		res.sendFile(__dirname + '/View/login.html');
    	}
    })
    
    //on transmet à l'utilisateur des informations le concenant afin de faciliter le traitement côté utilisateur, notamment avec les sockets    
    app.get('/data', function(req, res, next) {
    	if (req === undefined) {
	    	//on récupére grâce à l'ORM sequelize les infos de l'utilisateur qui nous transmet la requête. Son id est connu gâce à passport
	        model.utilisateur.findOne({where: {id_utilisateur: req.user.id_utilisateur}}).then(user => {
	        	res.status(200);
	            res.json(user);
	        }).catch(function(err) {
	        	//en cas d'erreur on retourne le code 400 avec un message
	        	res.status(400);
	        	res.json({message: 'La récupération des données de l\'utilisateur ne s\'est pas effectuée correctement'});
	        });
    	} else {
    		res.status(400);
    		res.json({message: 'La requête vers le serveur n\'est pas correcte'});
    	}
    });
    
    //on accède à l'application si l'on est logué, sinon on est redirigé par la fonction isLogged vers la page login
    app.get('/', isLogged, function(req, res, next) {
    	model.utilisateur.findOne({where: {id_utilisateur: req.user.id_utilisateur}}).then(user => {
    		if (user.type_utilisateur == 1) {
    			res.sendFile(__dirname + '/View/admin.html');
    		} else if (user.type_utilisateur == 2) {
    			res.sendFile(__dirname + '/View/index.html')
    		}
    	})
        
    });
    
    //donne le classement des joueurs
    app.get('/players', function(req, res, next) {
    	model.utilisateur.findAll({order: [['credit', 'DESC']]}).then(users => {
    		res.status(200);
    		res.json({players: users});
    	}).catch(err => {
    		res.status(400);
    		res.json({message: 'La requête vers le serveur n\'est pas correcte'});
    	});
    });
    
    
    //donne la liste des zones possédées par le joueur qui fait la demande
    app.get('/zones', function(req, res, next) {
    	model.zone.findAll({where: {id_utilisateur: req.user.id_utilisateur}}).then(zones => {
    		res.status(200);
    		res.json(zones);
    	}).catch(err => {
    		res.status(400);
    		res.json({message: 'La requête vers le serveur n\'est pas correcte'});

    	});
    });
    
	//donne les stats sur les zones d'un joueur (le nombre de passage des autres joueurs dans chacune des zones qu'il possède)
	app.get('/stats', function(req, res, next) {
		model.sequelize.query('CALL stats(:id_user)', {replacements: {id_user: req.user.id_utilisateur}}).then(r => {
			res.status(200);
			res.json(r);
		}).catch(err => {
			res.status(400);
			res.json({message: 'La requête vers le serveur n\'est pas correcte'});
		});
	});
    
	app.put('/vendre', function(req, res, next) {
	model.zone.findOne({where: {id_zone: req.body.id_zone, id_utilisateur: req.user.id_utilisateur}}).then(zone => {
		var gain = zone.gain;
		model.utilisateur.findOne({where: {id_utilisateur: req.user.id_utilisateur}}).then(user => {
			var nouveau_credit = user.credit + 0.75 * zone.valeur;
			user.update({credit: nouveau_credit});
			io.sockets.emit('zone_vendu', zone);
			res.json({credit: user.credit});
			});
			zone.update({id_utilisateur: null});
		});
	});

    app.put('/acheter', function(req, res, next) {
    	console.log(req.body);
    	var cout = 0;
    	var capital = 0;
    	model.zone.findOne({where: {id_zone: req.body.id_zone}}).then(zone => {
    		cout = zone.valeur;
    		zone.update({id_utilisateur: req.user.id_utilisateur});
    		io.sockets.emit('zone_acquired', zone);
    	}).then(zone => {
    		model.utilisateur.findOne({where: {id_utilisateur: req.user.id_utilisateur}}).then(user => {
    			capital = user.credit;
    			capital = capital - cout;
    			user.update({credit: capital});
    		    res.json({credit: user.credit});
    		});
    	});
    });
    
    app.get('/voir', function(req, res, next) {
    		console.log(req.query);
        model.sequelize.query('CALL voir(:id_user, :lat, :lng, 30)', {replacements: {id_user: req.user.id_utilisateur, lat: parseFloat(req.query.latitude), lng: parseFloat(req.query.longitude)}}).then(r => {
        		console.log(r);
        		res.json(r);
        	});
    });
    
    function isLogged(req, res, next) {
    	if (req.isAuthenticated()) {
    		return next();
    	}
    	res.redirect('/login')
    }
    
    io.sockets.on('connection', function (socket) {
        console.log('Un client est connecté avec l\'id = ' + socket.request._query.id);
        socket.userId = socket.request._query.id;
        socket.on("get_zones", function(data) {
            model.sequelize.query('CALL voir(:id_user, :lat, :lng, 30)', {replacements: {id_user:data.id, lat: parseFloat(data.latitude), lng: parseFloat(data.longitude)}}).then(r => {
        		console.log(r);
        		socket.emit('give_zones', r);
        		for (var zone of r) {
        		    console.log('rayon: ' + zone.rayon);
        		    distance = (6366*Math.acos(Math.cos(radians(data.latitude))*Math.cos(radians(zone.latitude))*Math.cos(radians(zone.longitude) - radians(data.longitude))+Math.sin(radians(data.latitude))*Math.sin(radians(zone.latitude)))) * 1000;
        		    console.log('distance : ' + distance);
        		    if (distance <= zone.rayon) {
        		        console.log('distance OK');
        		        if (zone_utilisateur_present[data.id] != zone.id_zone && zone.id_utilisateur != data.id) { 
        		            console.log('utilisateur pas deja present zone');
        		            var key = zone.id_zone;
        		            if (locked_zones_utilisateur[data.id] === undefined || locked_zones_utilisateur[data.id].key <= Date.now()) {
            		            console.log(data.id + ' est entré dans la zone ' + zone.id_zone + ' de ' + zone.id_utilisateur);
	                            model.utilisateur.findOne({where: {id_utilisateur: zone.id_utilisateur}}).then(user => {
	                                if (user != null) {
	                                    var nouveau_credit = user.credit + zone.gain;
	                                    var id_utilisateur_credite = user.id_utilisateur;
	                                    user.update({credit: nouveau_credit});
	                                    var temps = new Date(Date.now());
	                                    temps.setMinutes(temps.getMinutes() + 1);
	                                    console.log(temps);
	                                    zone_utilisateur_present[data.id] = zone.id_zone;
	                                    var key = zone.id_zone;
	                                    locked_zones_utilisateur[data.id]= {key: temps};
	                                    var passage = model.passage.build({
	                                        id_utilisateur_proprietaire: id_utilisateur_credite,
	                                        id_utilisateur_passe: data.id,
	                                        id_zone: zone.id_zone,
	                                        date_passage: Date.now()
	                                    }).save();
	                                    for (var socket_id of Object.keys(io.sockets.sockets)) {
	                                        var socket_user = io.sockets.connected[socket_id];
	                                        if (socket_user.userId == id_utilisateur_credite) {
	                                            console.log('Je credite et je notifie ' + id_utilisateur_credite);
	                                            socket_user.emit('get_credit', {credit: nouveau_credit});
	                                            break;
                                            }
                                        }
                                    }
	                            });
	                        }
	                    }
	                    break;
                    } else {
                        if (zone_utilisateur_present[data.id] == zone.id_zone) {
                            console.log(data.id + ' sort de la zone ' + zone.id_zone);
                            delete zone_utilisateur_present[data.id];
                        }
                   }
                }
        	});
        	
        });
    });
    
     // =====================================
    // Partie administrateur ========
    // ======================================
    
    app.put('/ajoutlieu', function(req, res, next) {
    console.log(req.body.latitude);
    console.log(req.body.longitude);
    console.log(req.body.rayon);
        model.sequelize.query('CALL list_lieux_meme_zone(:lat, :lng, :ray)', {replacements: {lat: parseFloat(req.body.latitude), lng: parseFloat(req.body.longitude), ray: req.body.rayon}}).then(r => {
            console.log(r.length);
            if (r.length == 0) {
                model.zone.build({
                    latitude: req.body.latitude,
                    longitude: req.body.longitude,
                    rayon: req.body.rayon,
                    valeur: req.body.valeur,
                    libelle: req.body.libelle,
                    description: req.body.description,
                    gain: req.body.gain,
                    dateCreation: Date.now()
               }).save().then(zone_added => {
               		id_zone_added = zone_added.id_zone;
               		res.status(200);
            		res.json({message: 'La zone ' + req.body.libelle + ' a été correctement ajouté'});
               });
           }
       });
    });
    
    app.get('/admin_zones', function(req, res, next) {
    	model.zone.findAll({where: {isActif: true}}).then(zones => {
    		res.json(zones);
    	})
    })
    
    app.get('/histogram', function(req, res, next) {
        var libres = 0;
        var occupees = 0;
        model.zone.findAndCountAll({where: {id_utilisateur: null}}).then(r => {
            console.log(r.count);
            libres = r.count;
            model.zone.findAndCountAll({where: {id_utilisateur: {[model.Sequelize.Op.not]: null}}}).then(r => {
                console.log(r.count);
                occupees = r.count;
                console.log(libres + "     " + occupees);
                res.json({libre: libres, occupee: occupees});
            });
        });
    });
    
    app.get('/stat_achat_zone', function(req, res, next) {
        model.sequelize.query('CALL ps_statistique_achat_zone(:typeactionsql)', {replacements: {typeactionsql: 'A'}}).then(r => {
            res.json(r);
        });
    });
    
     app.get('/stat_classement_players', function(req, res, next) {
        model.sequelize.query('CALL ps_statistique_users(:nombre_joueurs)', {replacements: {nombre_joueurs: 10}}).then(r => {
            res.json(r);
        });
    });
    
    app.get('/players_admin', isLogged, function(req, res, next) {
    	model.utilisateur.findAll({order: [['credit', 'DESC']]}).then(users => {
    		res.json({players: users});
    	});
    });
    
    app.get('/zones_admin', isLogged, function(req, res, next) {
    	model.zone.findAll({order: [['valeur', 'DESC']]}).then(lieux => {
    		res.json({zones: lieux});
    	});
    });
    
    app.put('/gest_zones', function(req, res, next) {
		model.zone.findOne({where: {id_zone: req.body.id_zone}}).then(zone => {
			zone.update({isActif: req.body.etat});
			zone.update({perimetre: req.body.perimetre});
			zone.update({gain: req.body.gain});
			zone.update({valeur: req.body.valeur});
			res.json(zone);
		});
    });
    
    app.put('/gest_users', function(req, res, next) {
        model.utilisateur.findOne({where: {id_utilisateur: req.body.id_user}}).then(utilisateur => {
			utilisateur.update({banni: !utilisateur.banni});
			res.json(utilisateur);
		});
    });
    
    app.post('/upload', function(req, res, next) {
    	 var form = new formidable.IncomingForm();
    	 form.parse(req, function (err, fields, files) {
    	 	var oldpath = files.file.path;
    		var newpath = __dirname + '/View/Images/lieux/' + id_zone_added + path.extname(files.file.name);
    		fs.rename(oldpath, newpath, function (err) {
	        	if (err) throw err;
		        res.send(200);
    		});
    	 });
    });
        
    
    function radians(degree) {
        return degree * (Math.PI / 180);
    }
}