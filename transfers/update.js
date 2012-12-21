Pending = require('../models').Pending;
var winston = require('winston');
var logger = new (winston.Logger)({
    transports: [
      new (winston.transports.Console)(),
      new (winston.transports.File)({ filename: 'requests.log', json:false })
    ]
});


function updateHandler(req, res){

	var tID=req.body.transferID;
	var status=req.body.status;
	var newHash=req.body.newHash;

	User.find({ 'ip': req.ip }, function (error, users) {
	    console.log("tid " + tID + " status " + status + " newHash " + newHash + " result " + users);
	    if (users == undefined || users.length == 0) {
	        logger.error('update.js-updatingHandler: Cannot find user with IP ' + req.ip);
	        //console.log('Cannot find user with IP ' + req.ip);
	        res.send({ 'status': 'Error', 'text': 'Cannot find user with IP ' + req.ip });
	        return;
	    }
	    var mac = users[0].mac
	    var nick = users[0].nick
	    console.log(mac);
	    console.log("downloader" + mac);
	    console.log("tID" + tID);
	    Pending.find({ 'transferID': parseFloat(tID), 'downloader': mac }, { 'type': 1 }, function (error, updatingClient) {
	        console.log(updatingClient);
	        var type = updatingClient[0].type;
	        console.log(type);

	        if (type == 'direct' || type == 'secondleg') {

	            Pending.find({ 'transferID': tID }, { 'uploader': 1, 'fileHash': 1, 'type': 1, 'downloader': 1 }, function (error, requests) {

	                Pending.remove({ "transferID": tID }, function (err, removed) {	// removes all pending transfer with id tID from pending 
	                    logger.info("Update  type " + type + removed);
	                    console.log(removed);

	                    for (var i = 0; i < requests.length; i++) {

	                        if (requests[i].type == 'secondleg') { // adds entries to pending for deletion of replicated files.
	                            var newPending = new Pending();
	                            newPending.fileHash = requests[i].fileHash;
	                            newPending.downloader = requests[i].uploader;
	                            newPending.uploader = "0000000000000000";
	                            newPending.transferID = tID;
	                            newPending.type = 'delete';

	                            newPending.save();
	                            console.log("Pending to delete file added");
	                            //logger.info("Update  type "+ type + newPending + " added");
	                            console.log(newPending);
	                        }
	                    }
	                    var downloader = requests[0].downloader;
	                    if (type == 'direct')
	                        logger.info('update.js-updateHandler: File transfer for direct leg completed, ' + downloader + ' has received file, made changes to pending')
	                    else
	                        logger.info('update.js-updateHandler: File transfer for secondleg completed, ' + downloader + ' has received file, made changes to pending')
	                    res.send({ 'status': 'OK', 'text': 'Update Complete' });

	                });

	            });
	        }

	        if (type == 'firstleg') {


	            if (status == 'done') {

	                Pending.find({ 'transferID': tID, 'type': 'direct' }, function (error, request) {
	                    var newPending = new Pending();
	                    newPending.fileHash = newHash;
	                    newPending.downloader = request[0].downloader;
	                    newPending.uploader = mac;
	                    newPending.fileName = request[0].fileName;
	                    newPending.fileName = request[0].fileName;
	                    newPending.transferID = tID;
	                    newPending.type = 'secondleg';
	                    newPending.fileSize = request[0].fileSize;
	                    newPending.symKey = request[0].symKey;
	                    newPending.uploaderIP = request[0].uploaderIP;
	                    newPending.nick = request[0].nick;

	                    newPending.save();
	                    logger.info('update.js-updateHandler: firstleg completed, ' + nick + ' has received file, made changes to pending')
	                    console.log(newPending);

	                    Pending.remove({ "transferID": tID, 'downloader': mac, 'type': 'firstleg' }, function (err, removed) {
	                        console.log(removed);
	                        logger.info('update.js-updateHandler: firstleg completed , pending for' + nick + ' removed, made changes to pending')
	                        res.send({ 'status': 'OK', 'text': 'Update Complete' });
	                    });

	                });
	            }
	            else {

	                Pending.remove({ "transferID": tID, 'downloader': mac, 'type': 'firstleg' }, function (err, removed) {
	                    console.log(removed);
	                    logger.info('update.js-updateHandler: firstleg not completed, pending for' + nick + ' removed, made changes to pending')
	                    res.send({ 'status': 'OK', 'text': 'Update Complete' });
	                });
	            }

	        }

	        if (type == 'delete') {

	            Pending.remove({ "transferID": tID, 'downloader': mac, 'type': 'delete' }, function (err, removed) {
	                console.log(removed);
	                logger.info('update.js-updateHandler: firstleg completed, file has been deleted by friend ' + nick)
	                res.send({ 'status': 'OK', 'text': 'Update Complete' });
	            });

	        }


	    });

	});

}





exports.updateHandler = updateHandler;