User=require('../models').User;
Pending=require('../models').Pending;
asyncFor=require('../users/search').asyncFor;
var userTimeout = require('./timeout').userTimeout;

function pendingHandler(req, res, onlineUsers) {

    User.find({'ip' : res.ip}, function(error, users) {

		if (users == undefined|| users.length==0) {
				console.log('Cannot find details about the user');
				res.send({ 'status': 'ERROR', 'text': 'Cannot find details about the user' });
				return;
			}
        clearTimeout(onlineUsers[users.mac]);
        onlineUsers[users.mac] = setTimeout(userTimeout(users.mac, onlineUsers), 1 * 60 * 1000);
		var mac=users[0].mac;
        console.log('Pendings requested by user with nick '+ users[0].nick);
		Pending.find({ 'downloader': mac }, function (error, results) {
			var pendings=[];
			var users=[];
			var result=[];
			var onlineUsers=[0];
			if (results == undefined||results.length==0) {
				console.log('No pendings');
				res.send( pendings );
			}
			else{
			for(i=0;i<results.length;i++){
			users.push(results[i].uploader);
			}
			User.find({ 'online': true, 'mac':{$in: users}}, function (error, online) {
				asyncFor(online.length, function(loop) {  
					onlineUsers.push(online[loop.iteration()].mac);
					loop.next();
					},
					function(){
						for(i=0;i<results.length;i++){
							if(checkIn(onlineUsers,results[i].uploader)){
								pendings.push(results[i]);
							}
						}
						console.log('Pending '+ pendings);  
						res.send (pendings);
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