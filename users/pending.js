User=require('../models').User;
Pending=require('../models').Pending;
asyncFor=require('../transfers/search').asyncFor;
//var MongoDB = require('winston-mongodb').MongoDB;

var winston = require('winston');
var MongoDB = require('winston-mongodb')//.MongoDB;

//require('winston-mongo').Mongo;
var updateLastPingTime = require('./online').updateLastPingTime;

var logger = new (winston.Logger)({
    transports: [
      new (winston.transports.Console)()
    ]
});
 logger.add(winston.transports.MongoDB, { db: 'log', collection: 'log'});
/*var databaseLogger = new (winston.Logger)({
    transports:[
        new (winston.transports.MongoDB)({ db: 'log'})
    ]
})*/
var pendingLogger = new (winston.Logger)({
    transports: [
      new (winston.transports.Console)(),
      new (winston.transports.File)({ filename: 'pendings.log', json:false})
    ]
});

    
function pendingHandler(req, res) {

    User.find({ 'ip': req.ip }, function (error, users) {

        if (users == undefined || users.length == 0) {
            pendingLogger.info('pending.js-pendingHandler: Unable to retrieve pendings. Reason - Cannot find user with IP' + req.ip);
            res.send({ 'status': 'Error', 'text': 'Cannot find user with IP ' + req.ip });
            return;
        }
        var x = {};
        x["x"] = 1;
        x["y"] = 2;
        logger.info(x);
        var mac = users[0].mac;
        var nick = users[0].nick;

        updateLastPingTime(mac); // Update the time of the last ping for this user

        Pending.find({ 'downloader': mac }, function (error, results) {

            var pendings = [];
            var users = [];
            var result = [];
            var onlineUsers = [0];
            var onlineUserIPs = [0];
            var onlineUserNicks = [0];


            if (error) {
                pendingLogger.error('pending.js-pendingHandler: Unable to retrieve pendings. Reason - Mongo error. IP' + req.ip);
            }
            if (results == undefined || results.length == 0) {
                pendingLogger.info('pending.js-pendingHandler: Retrieved Pendings. Number of pendings found - 0. Nick' + nick);
                res.send(pendings);
            }
            else {

                for (i = 0; i < results.length; i++) {
                    if (results[i].uploader == "0000000000000000")
                        pendings.push(results[i]);
                    else if (users.indexOf(results[i].uploader) == -1)
                        users.push(results[i].uploader);
                }

                //console.log("Users holding pending files:");
                //console.log(users);

                User.find({ 'online': true, 'mac': { $in: users} }, function (error, online) {

                    if (error)
                        pendingLogger.error('pending.js-pendingHandler: Unable to retrieve pendings. Reason -  Cannot search online users for nick ' + nick);

                    asyncFor(online.length, function (loop) {
                        onlineUsers.push(online[loop.iteration()].mac);
                        onlineUserIPs.push(online[loop.iteration()].ip);
                        onlineUserNicks.push(online[loop.iteration()].nick);
                        loop.next();

                    }, function () {
                        for (i = 0; i < results.length; i++) {

                            var index = onlineUsers.indexOf(results[i].uploader);

                            if (index != -1) {
                                results[i].uploaderIP = onlineUserIPs[index];
                                results[i].nick = onlineUserNicks[index];
                                pendings.push(results[i]);
                            }
                        }
                        //console.log('Pendings returned:');
                        //pendings[0].uploaderIP = "127.0.0.1";
                        pendingLogger.info('pending.js-pendingHandler: Retrieved Pendings. Number of pendings found - ' + pendings.length + '. Nick' + nick);
                        //found ' + pendings.length + ' pendings for user ' + nick);
                        //console.log(pendings);
                        res.send(pendings);
                    }
				);


                });
            }
        });
    });


}

function checkIn(arr, val){

	for(var i=0;i<arr.length;i++){
		if(arr[i]==val)
			return true;
	}
	return false;

}

exports.pendingHandler = pendingHandler;