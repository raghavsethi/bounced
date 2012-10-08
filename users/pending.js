User=require('../models').User;
Pending=require('../models').Pending;
asyncFor=require('../users/search').asyncFor;
var userTimeout = require('./timeout').userTimeout;

function pendingHandler(req, res, onlineUsers) {

    User.find({ 'ip': req.ip }, function (error, users) {

        if (users == undefined || users.length == 0) {
            console.log('Cannot find user with IP ' + req.ip);
            res.send({ 'status': 'Error', 'text': 'Cannot find user with IP ' + req.ip });
            return;
        }

        clearTimeout(onlineUsers[users.mac]);
        onlineUsers[users.mac] = setTimeout(userTimeout(users.mac, onlineUsers), 6 * 1000);
        
        var mac = users[0].mac;
        console.log('Pendings requested by user with nick ' + users[0].nick);

        Pending.find({ 'downloader': mac }, function (error, results) {

            var pendings = [];
            var users = [];
            var result = [];
            var onlineUsers = [0];

            if (results == undefined || results.length == 0) {
                console.log('No pendings');
                res.send(pendings);
            }
            else {

                for (i = 0; i < results.length; i++) {
                    users.push(results[i].uploader);
                    console.log(results[i].uploader);
                }

                User.find({ 'online': true, 'mac': { $in: users} }, function (error, online) {

                    if (error)
                        console.log(error);

                    asyncFor(online.length, function (loop) {
                        onlineUsers.push(online[loop.iteration()].mac);
                        loop.next();

                    },	function () {
					    for (i = 0; i < results.length; i++) {
					        if (checkIn(onlineUsers, results[i].uploader)) {
					            pendings.push(results[i]);
					        }
					    }
					    console.log('Pending ' + pendings);
					    res.send(pendings);
					}
				);


                });
            }
        });
    });

    // Naved, your code will come here..

}

function checkIn(arr, val){
	
	for(var i=0;i<arr.length;i++){
		if(arr[i]==val)
			return true;
	}
	return false;

}

exports.pendingHandler = pendingHandler;