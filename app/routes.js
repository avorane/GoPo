module.exports = function(app, passport) {

    // =====================================
    // HOME PAGE (with login links) ========
    // =====================================
    app.get('/login', function(req, res, next) {
    	console.log('Je suis la page login et je suis appele');
        res.sendFile('/var/www/html/codiad/workspace/GoPo/View/Acceuil.html');
    });
    
    app.post('/login', passport.authenticate('local-signin', {
            successRedirect: '/index',
            failureRedirect: '/login'
        }));
    
    app.get('/index', isLogged, function(req, res, next) {
		res.sendFile('/var/www/html/codiad/workspace/GoPo/View/Index.html');
    });
    
    function isLogged(req, res, next) {
    	if (req.isAuthenticated()) {
    		console.log('Je ne suis pas authentifie');
    		return next();
    	}
    	res.redirect('/login')
    }
}