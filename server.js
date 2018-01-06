var express = require('express');  
var app = express();
var server = require('http').createServer(app);
var https = require('https');
var fs = require('fs');
var models = require('./app/Model');
var passport = require('passport');
var session = require('express-session');
var bodyParser = require('body-parser');
var pem = require('pem');

app.use('/', express.static(__dirname));

var options = {
  key: fs.readFileSync('./keys/gopo.key', 'utf8'),
  cert: fs.readFileSync('./keys/gopo.crt', 'utf8'),
  requestCert: false
};

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
require('./app/routes.js')(app, passport, models);
server.listen(8090);
//https.createServer(options, app).listen(8090, function() {console.log('Je suis securise');});
