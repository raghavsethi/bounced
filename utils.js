User = require('../models').User;

function getUserByIp(ip) {
    User.find({'ip' : ip}, function(error, users) {
        return users[0];
    }
}