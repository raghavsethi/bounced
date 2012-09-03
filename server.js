var express = require('express');
var app = express();

var register = require('./register');

app.get('/', function(req, res){
  res.send('Hello World');
});

app.get('/register', register.register);

app.listen(3000);
console.log('Listening on port 3000');