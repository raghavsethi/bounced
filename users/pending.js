User=require('../models').User;
Pending=require('../models').Pending;
asyncFor=require('../users/search').asyncFor;
var winston = require('winston');
var logger = new (winston.Logger)({
    transports: [
      new (winston.transports.Console)(),
      new (winston.transports.File)({ filename: 'requests.log', json:false})
    ]
});
var userTimeout = require('./timeout').userTimeout;

function pendingHandler(req, res, onlineUsers) {

    User.find({ 'ip': req.ip }, function (error, users) {
	
		
        if (users == undefined || users.length == 0) {
            console.log('Cannot find user with IP ' + req.ip);
			logger.info('pending   cannot find user with ip ' + req.ip);
            res.send({ 'status': 'Error', 'text': 'Cannot find user with IP ' + req.ip });
            return;
        }

        //console.log("pendingHandler onlineUsers:");
        //console.log(onlineUsers);

        clearTimeout(onlineUsers[users[0].mac]);
        onlineUsers[users[0].mac] = setTimeout(userTimeout(users[0].mac, onlineUsers), 6 * 1000);

        //console.log("pendingHandler2 onlineUsers:");
        //console.log(onlineUsers);

        var mac = users[0].mac;
		var nick = users[0].nick;
        console.log('Pendings requested by user ' + users[0].nick);

        Pending.find({ 'downloader': mac }, function (error, results) {

            var pendings = [];
            var users = [];
            var result = [];
            var onlineUsers = [0];
            var onlineUserIPs = [0];
            var onlineUserNicks = [0];

            if (error){
                console.log(error);
				//logger.error("pending  "+nick+"  "+error + "  in table Pending");
			}
            if (results == undefined || results.length == 0) {
                console.log('No pendings found');
                res.send(pendings);
            }
            else {

                for (i = 0; i < results.length; i++) {
                    if (users.indexOf(results[i].uploader) == -1)
                        users.push(results[i].uploader);
                }

                console.log("Users holding pending files:");
                console.log(users);

                User.find({ 'online': true, 'mac': { $in: users} }, function (error, online) {

                    if (error)
                        console.log(error);
						//logger.error("pending  "+nick+"  "+error+" in table users");

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
                        console.log('Pendings returned:');
                        //pendings[0].uploaderIP = "127.0.0.1";
						for(i=0; i < pendings.length; i++)
							logger.info("pending  "+nick+"  "+pendings[i].fileName+"  "+pendings[i].fileHash);
                        console.log(pendings);
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