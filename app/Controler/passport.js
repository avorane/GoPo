module.exports = function(passport, utilisateur) {
	var Utilisateur = utilisateur;
	var LocalStrategy = require('passport-local').Strategy;
	console.log('Je suis passport et je suis appele');

	passport.use('local-signin', new LocalStrategy({
        usernameField: 'username',
        passwordField: 'password',
        passReqToCallback: true
    },
    function(req, login, password, done) {
        var Utilisateur = utilisateur;
        console.log('Je suis appele');
        console.log('Pssw: ' + password);
        Utilisateur.findOne({
            where: {
                pseudo: login
            }
        }).then(function(utilisateur) {
        	console.log(utilisateur.mot_de_passe);
            if (!utilisateur) {
            	console.log('Aucun Utilisateur');
                return done(null, false, {
                    message: 'Cet utilisateur n\'existe pas'
                });
            }
            if (utilisateur.mot_de_passe !== password) {
                return done(null, false, {
                    message: 'Mot de passe incorrect'
                });
            }
            var userinfo = utilisateur.get();
            return done(null, userinfo);
        }).catch(function(err) {
            console.log("Error:", err);
            return done(null, false, {
                message: 'Something went wrong with your Signin'
            });
        });
    }
	));
	
	passport.serializeUser(function(user, done) {
		console.log(user.id_utilisateur);
    	done(null, user.id_utilisateur);
	});
	
	passport.deserializeUser(function(id, done) {
	    Utilisateur.findById(id).then(function(user) {
	        if (user) {
	            done(null, user.get());
	        } else {
	            done(user.errors, null);
	        }
	    });
	});
}