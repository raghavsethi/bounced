var userTimeout = require('./timeout').userTimeout;

function pendingHandler(req, res, onlineUsers) {

    User.findOne({'ip' : req.ip}, function(error, user) {

        clearTimeout(onlineUsers[user.mac]);
        onlineUsers[user.mac] = setTimeout(userTimeout(user.mac, onlineUsers), 1 * 60 * 1000);

        res.send([]);
    });

    // Naved, your code will come here..

}

exports.pendingHandler = pendingHandler;