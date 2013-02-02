User=require('../models').User;
Pending=require('../models').Pending;
asyncFor=require('../users/search').asyncFor;

var winston = require('winston');
var updateLastPingTime = require('./online').updateLastPingTime;

var logger = new (winston.Logger)({
    transports: [
      new (winston.transports.Console)(),
      new (winston.transports.File)({ filename: 'requests.log', json:false})
    ]
});
var pendingLogger = new (winston.Logger)({
    transports: [
      new (winston.transports.Console)(),
      new (winston.transports.File)({ filename: 'pendings.log', json:false})
    ]
});


function pendingHandler(req, res) {

    User.find({ 'ip': req.ip }, function (error, users) {

        if (users == undefined || users.length == 0) {
            pendingLogger.info('pending.js-pendingHandler: cannot find user with ip' + req.ip);
            res.send({ 'status': 'Error', 'text': 'Cannot find user with IP ' + req.ip });
            return;
        }

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
                pendingLogger.error("pending  " + nick + "  " + error + "  in table Pending");
            }
            if (results == undefined || results.length == 0) {
                pendingLogger.info('pending.js-pendingHandler: found no pendings for user ' + nick);
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
                        pendingLogger.error('pending.js-pendingHandler: Error while reading Users for ' + nick);

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
                        pendingLogger.info('pending.js-pendingHandler: found ' + pendings.length + ' pendings for user ' + nick);
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