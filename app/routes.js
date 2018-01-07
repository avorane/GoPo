module.exports = function(app, passport, model, io) {

    var locked_zones_utilisateur = {};
    var zone_utilisateur_present = {};

    // =====================================
    // Partie utilisateur ========
    // =====================================
    app.get('/login', function(req, res, next) {
    	console.log('Je suis la page login et je suis appele');
        res.sendFile(__dirname + '/View/Acceuil.html');
    });
    
    app.post('/login', function(req, res, next) {
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
                return res.redirect('/index');
              }
            });
        })(req, res, next);
    });
        
    app.get('/data', function(req, res, next) {
        model.utilisateur.findOne({where: {id_utilisateur: req.user.id_utilisateur}}).then(user => {
            res.json(user);
        });
    });
    
    app.get('/admin', isLogged, function(req, res, next) {
        res.sendFile(__dirname + '/View/Index_admin.html');
    });
       
    app.get('/index', isLogged, function(req, res, next) {
		res.sendFile(__dirname + '/View/Index.html');
    });
    
    app.get('/players', isLogged, function(req, res, next) {
    	model.utilisateur.findAll({order: [['credit', 'DESC']]}).then(users => {
    		res.json({players: users});
    	});
    });
    
    app.get('/zones', isLogged, function(req, res, next) {
    	model.zone.findAll({where: {id_utilisateur: req.user.id_utilisateur}}).then(zones => {
    		res.json(zones);
    	});
    	console.log(req.user.id_utilisateur);
    })
    
    app.get('/stats', function(req, res, next) {
        model.sequelize.query('CALL stats(:id_user)', {replacements: {id_user: req.user.id_utilisateur}}).then(r => {
            res.json(r);
        });
   });
    
    app.put('/vendre', function(req, res, next) {
    	console.log(req.body);
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
    		console.log('Je ne suis pas authentifie');
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
    // =====================================
    
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
               }).save();
               res.send(200);
           }
       });
    });
    
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
        
    
    function radians(degree) {
        return degree * (Math.PI / 180);
    }
}