Pending=require('../models').Pending;
User=require('../models').User;
var winston = require('winston');
var logger = new (winston.Logger)({
    transports: [
      new (winston.transports.Console)(),
      new (winston.transports.File)({ filename: 'requests.log', json:false })
    ]
});
function statusHandler(req,res){
	console.log(req.ip);
	var ip=req.ip;
	var total=5;
	var result=[];
	var map=[];
	User.find({'ip': req.ip},{'mac':1},function (error,users) {
		if(users === undefined || users.length === 0){
            logger.info('status.js-statusHandler: Cannot find user with IP ' + req.ip, error);
			res.send({ 'status': 'Error', 'text': 'Unregistered user' });
			return;
		}
		Pending.find({ 'downloader': users[0].mac}, function (error, pendingRequests) {
			if (pendingRequests === undefined || pendingRequests.length === 0) {
			    logger.info('status.js-statusHandler: Cannot find user with IP ' + req.ip, error);	
                console.log('No pending requests found.');
				res.send(result);
				return;
			}
			else{
				console.log(pendingRequests);
				for (i = 0; i < pendingRequests.length; i++) {
					if(map[pendingRequests[i].transferID]===undefined && pendingRequests[i].type==="secondleg"){
						map[pendingRequests[i].transferID]={'transferID':pendingRequests[i].transferID,'hash':pendingRequests[i].fileHash,'sent':1,'total':5};
					}
					else if(map[pendingRequests[i].transferID]===undefined){
						map[pendingRequests[i].transferID]={'transferID':pendingRequests[i].transferID,'hash':pendingRequests[i].fileHash,'sent':0,'total':5};
					}
					else if(pendingRequests[i].type==="secondleg"){
						map[pendingRequests[i].transferID]['sent']++;
					}
				}
				for(var i in map){
					result.push(map[i]);
				}
                logger.info('status.js-statusHandler: Sent information regarding ' + result.length + ' transfers for ip ' + req.ip);
				res.send(result);
				return;
			}
			
		});
	});
}
exports.statusHandler =statusHandler;