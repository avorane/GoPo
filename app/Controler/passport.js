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
        Utilisateur.findOne({
            where: {
                pseudo: login
            }
        }).then(function(utilisateur) {
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
                message: 'Erreur sur le login'
            });
        });
    }
	));
	
	passport.use('local-signup', new LocalStrategy({
        usernameField: 'username',
        passwordField: 'password',
        passReqToCallback: true
    },
    function(req, login, password, done) {
        var Utilisateur = utilisateur;
        Utilisateur.findOne({
            where: {
                pseudo: login
            }
        }).then(utilisateur => {
            if (utilisateur != null) {
            	console.log('Utilisateur déjà existant');
                return done(null, false, {
                    message: 'Cet utilisateur déjà'
                });
            }
            Utilisateur.build({
                pseudo: login,
                mot_de_passe: password,
                credit: 30,
                type_utilisateur: 2,
                dateCreation: Date.now(),
                banni: false
            }).save().then(user => {
                var userinfo = user.get();
                return done(null, userinfo);
            });
        }).catch(function(err) {
            console.log("Error:", err);
            return done(null, false, {
                message: 'Erreur sur le signup'
            });
        });
    }
	));
	
	passport.serializeUser(function(user, done) {
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
