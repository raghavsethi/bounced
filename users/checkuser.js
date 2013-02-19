var winston = require('winston');

var logger = new (winston.Logger)({
    transports: [
      new (winston.transports.Console)(),
      new (winston.transports.File)({ filename: 'requests.log', json:false })
    ]
});

function checkUserHandler(req, res) {

    User.find({ 'nick': req.body.nick }, function (error, users) {

        if (error || users == null) {
            logger.error('checkuser.js-checkUserHandler: Cannot verify. Reason - Mongo error. IP ' + req.ip);
            res.send({ 'status': 'Error', 'text': error });
            return;
        }

        if (req.body.nick.length === 0) {
            logger.error('checkuser.js-checkUserHandler: Cannot verify. Reason - Invalid username for IP ' + req.ip);
            res.send({ 'status': 'Error', 'text': "Invalid username" });
            return;
        }

        if (users.length > 0) {

            if (users.length == 1 && users[0].mac === req.body.mac)
            { }
            else {
                logger.info('checkuser.js-checkUserHandler: Cannot verify. Reason - Username ' + req.body.nick + '  already exists with mac ' + users[0].mac);
                res.send({ 'status': 'Error', 'text': 'Already taken' });
                return;
            }
        }

        logger.info('checkuser.js-checkUserHandler: Verified. User found an unresesrved username. IP: ' + req.ip + ', MAC: ' + req.body.mac + ' Nick: ' + req.body.nick);
        res.send({ 'status': 'OK', 'text': 'Username available' });
    });

}

exports.checkUserHandler = checkUserHandler;