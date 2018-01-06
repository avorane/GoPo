var express = require('express');  
var app = express(); 
var session = require('express-session')
var server = require('http').createServer(app);  
var io = require('socket.io')(server);

app.use(express.static(__dirname + '/node_modules'));
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true
}));
app.get('/login', function(req, res,next) {  
    res.sendFile(__dirname + '/GoPo_Front/Acceuil.html');
});

server.listen(8090); 