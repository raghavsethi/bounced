// User Handlers

function onlineUsersHandler(req, res) {
	User.find({'online':true}, function(error, users) { 
		res.send(users);
	});
}

function registerUserHandler(req, res) {
		
	User.find({'mac' :  req.body.mac}, function(error, users) {
	    console.log(error);
	    if (users == undefined)
		{
			console.log('New user arrived');
			newuser = new User();
			newuser.mac = req.body.mac;
			users = [];
			users.push(newuser);
		}

		if(users.length > 1) {
			console.log('Multiple users found for mac');
		}
		
		for(i=0; i<users.length; i++) {
			users[i].online = true;
			users[i].ip = req.ip;
			users[i].save();
			console.log('Saving user ' + users[i]);
		}

		req.on('close', function() {
			console.log('Client closed connection.');
			for(i=0; i<users.length; i++) {
				users[i].online = false;
				users[i].save();
			}
		});
		
		req.on('end', function() {
		  console.log('Client ended connection.');
			for(i=0; i<users.length; i++) {
				users[i].online = false;
				users[i].save();
			}
		});

	});
}

exports.registerUserHandler = registerUserHandler;
exports.onlineUsersHandler = onlineUsersHandler;