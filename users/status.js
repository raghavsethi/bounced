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
    var temp=[];
    User.find({ 'ip': req.ip }, { 'mac': 1 }, function (error, users) {
        if (users === undefined || users.length === 0) {
            logger.info('status.js-statusHandler: Cannot find user with IP ' + req.ip, error);
            res.send({ 'status': 'Error', 'text': 'Unregistered user' });
            return;
        }
        Pending.find({ 'downloader': users[0].mac, 'type': 'direct' }, { 'transferID': 1 }, function (error, pendingRequests) {
            if (pendingRequests === undefined || pendingRequests.length === 0) {
                logger.info('status.js-statusHandler: Cannot find user with IP ' + req.ip, error);
                console.log('No pending requests found.');
                res.send(result);
                return;
            }
            else {
                for (var k = 0; k < pendingRequests.length; k++) {
                    temp = [];
                    Pending.find({ 'transferID': pendingRequests[k], 'type': { $in: ['firstleg', 'secondleg']} }, function (error, tIDRequests) {
                        if (tIDRequests === undefined || tIDRequests.length === 0) {
                            logger.info('status.js-statusHandler: Cannot find user with IP ' + req.ip, error);
                            console.log('No pending requests found.');
                            result.push(temp);
                        }
                        else {
                            console.log(tIDRequests);
                            for (i = 0; i < tIDRequests.length; i++) {
                                if (map[tIDRequests[i].transferID] === undefined && tIDRequests[i].type === "secondleg") {
                                    map[tIDRequests[i].transferID] = { 'transferID': tIDRequests[i].transferID, 'hash': tIDRequests[i].fileHash, 'fileName': tIDRequests[i].fileName, 'fileSize': tIDRequests[i].fileSize, 'sent': 1, 'total': 5 };
                                }
                                else if (map[tIDRequests[i].transferID] === undefined) {
                                    map[tIDRequests[i].transferID] = { 'transferID': tIDRequests[i].transferID, 'hash': tIDRequests[i].fileHash, 'fileName': tIDRequests[i].fileName, 'fileSize': tIDRequests[i].fileSize, 'sent': 0, 'total': 5 };
                                }
                                else if (tIDRequests[i].type === "secondleg") {
                                    map[tIDRequests[i].transferID]['sent']++;
                                }
                            }
                            for (var i in map) {
                                temp.push(map[i]);
                            }
                            result.push(temp);
                        }
                    });
                }
                res.send(result);
                return
            }
        });

        
    });
}
exports.statusHandler =statusHandler;