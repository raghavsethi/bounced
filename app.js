var express = require('express')
  , http = require('http')
  , path = require('path')
  , models = require('./models');

var clearInactiveUsers = require('./users/online.js').clearInactiveUsers;

var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});

// Initialize users and ping times

GLOBAL.userLastPingTimes = {};

setInterval(clearInactiveUsers, 3000);

models.User.find({ 'online': true }, function (error, users) {
    for (i = 0; i < users.length; i++) {
        users[i].online = false;
        users[i].save();
    }
});

// Initialize models

User = models.User;
Friendship = models.Friendship;

// Request handlers

app.get('/online', function (req, res) {
	require('./userhandlers').onlineUsersHandler(req, res);
});

app.post('/register', function (req, res) {
	require('./users/register').registerUserHandler(req, res);
});

app.get('/pending',  function (req, res) {
    require('./users/pending').pendingHandler(req, res);
});

app.get('/search/:query',  function (req, res) {
    require('./transfers/search').searchHandler(req, res);
});

app.post('/download', function (req, res) {
    require('./transfers/download').downloadHandler(req, res);
});

app.post('/update', function (req, res) {
    require('./transfers/update').updateHandler(req, res);
});

app.get('/key',  function (req, res) {
    require('./users/key').keyHandler(req, res);
});

app.get('/status',  function (req, res) {
    require('./users/status').statusHandler(req, res);
});

app.post('/sync', function (req, res) {
    require('./users/sync').syncHandler(req, res);
});

app.post('/checkuser', function (req, res) {
    require('./users/checkuser').checkUserHandler(req, res);
});

exports.userLastPingTimes = userLastPingTimes;