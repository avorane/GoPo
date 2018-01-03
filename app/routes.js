module.exports = function(app, passport, model, io) {

    // =====================================
    // HOME PAGE (with login links) ========
    // =====================================
    app.get('/login', function(req, res, next) {
    	console.log('Je suis la page login et je suis appele');
        res.sendFile(__dirname + '/View/Acceuil.html');
    });
    
    app.post('/login', passport.authenticate('local-signin', {
            successRedirect: '/index',
            failureRedirect: '/login'
        }));
        
    app.get('/data', function(req, res, next) {
        model.utilisateur.findOne({where: {id_utilisateur: req.user.id_utilisateur}}).then(user => {
            res.json(user);
        });
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
    
    app.put('/vendre', function(req, res, next) {
    	console.log(req.body);
    	model.zone.findOne({where: {id_zone: req.body.id_zone}}).then(zone => {
    		zone.update({id_utilisateur: null});
    	}).then(zone => {
    		res.sendStatus(200);
    	})
    });
    
    app.put('/acheter', function(req, res, next) {
    	console.log(req.body);
    	var cout = 0;
    	var capital = 0;
    	model.zone.findOne({where: {id_zone: req.body.id_zone}}).then(zone => {
    		cout = zone.valeur;
    		zone.update({id_utilisateur: req.user.id_utilisateur});
    	}).then(zone => {
    		model.utilisateur.findOne({where: {id_utilisateur: req.user.id_utilisateur}}).then(user => {
    			capital = user.credit;
    			capital = capital - cout;
    			user.update({credit: capital});
    			res.sendStatus(200);
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
        console.log('Un client est connecté ! : ' + socket.request.user);
    });
}