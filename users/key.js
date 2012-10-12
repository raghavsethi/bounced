var url = require("url");
Pending=require('../models').Pending;
User=require('../models').User;

function keyHandler(req,res){
	var transferID = url.parse(req.url).query;
	transferID = transferID.replace(/\+/g," ");
	console.log("Request for " + transferID + " received.");
	//console.log(req.ip);
	User.find({'ip': req.ip},{'mac':1},function (error,users) {
		if(users === undefined || users.length === 0){
			console.log('Unregistered user');
			res.send({ 'status': 'Error', 'text': 'Unregistered user' });
			return;
		}
		
		Pending.find({ 'transferID':transferID, 'uploader':users[0].mac, 'symKey':{$ne:null}}, function (error, pendingRequests) {
			//console.log(pendingRequests.length);
			if (pendingRequests === undefined || pendingRequests.length === 0) {
				console.log('No such pending request');
				res.send({ 'status': 'Error', 'text': 'No pending requests' });
			}
			else{
				res.send({'key':pendingRequests[0].symKey});
				return;
				/*for (i = 0; i < pendingRequests.length; i++) {
					if (pendingRequests[i].symKey != null){
						res.send({'key':pendingRequests[i].symKey});
						return;
					}
				}*/
			}
			res.send({ 'status': 'Error', 'text': 'Invalid user/transferID' });
			return;
		});
	});
}

exports.keyHandler =keyHandler;