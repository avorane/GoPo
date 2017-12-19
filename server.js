var express = require('express');  
var app = express();
var server = require('http').createServer(app);  
var models = require('./app/Model');
var passport = require('passport');
var session = require('express-session');
var bodyParser = require('body-parser');

app.use('/', express.static(__dirname));

models.sequelize.sync().then(function() {
 
    console.log('Nice! Database looks fine')
 
}).catch(function(err) {
 
    console.log(err, "Something went wrong with the Database Update!")
 
});

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

app.use(session({
    secret: 'keyboard cat',
    resave: true,
    saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());

require('./app/Controler/passport.js')(passport, models.utilisateur);
require('./app/routes.js')(app, passport);
server.listen(8090); 