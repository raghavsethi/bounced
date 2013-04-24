Pending = require('../models').Pending;
var winston = require('winston');
var MongoDB = require('winston-mongodb')//.MongoDB;

var logger = new (winston.Logger)({
    transports: [
      new (winston.transports.Console)(),
      new (winston.transports.File)({ filename: 'requests.log', json:false })
    ]
});

var researchLogger = new (winston.Logger)({
    transports: [
      new (winston.transports.Console)()
    ]
});
researchLogger.add(winston.transports.MongoDB, { db: 'log', collection: 'log'});


function updateHandler(req, res){

	var tID=req.body.transferID;
	var status=req.body.status;
	var newHash=req.body.newHash;
	var uploaderMac = req.body.uploader;

	User.find({ 'ip': req.ip }, function (error, users) {
	    console.log("tid " + tID + " status " + status + " newHash " + newHash + " result " + users);
	    if (users == undefined || users.length == 0) {
	        logger.error('update.js-updatingHandler: Update request not completed. Reason - Cannot find user with IP ' + req.ip);
	        //console.log('Cannot find user with IP ' + req.ip);
	        res.send({ 'status': 'Error', 'text': 'Cannot find user with IP ' + req.ip });
	        return;
	    }
	    var mac = users[0].mac
	    var nick = users[0].nick
	    
	    if (status == 'missing') {
	            var missingFile = newHash;
	            var missingUser = mac;

                File.find({ 'hash': missingFile }, function (error, files) {
                    if (files == undefined || files.length == 0) {
	                    logger.error('update.js-updateHandler: Missing - File with hash ', missingFile, ' could not be found' );
	                    res.send({ 'status': 'OK', 'text': 'Missing Update complete' });
	                    return;
	                }

                    if (files[0].users.length == 1) {
                        File.find({ 'hash': missingFile }).remove();
                        logger.info('update.js-updateHandler: Missing - Successful. Removed File with hash ', missingFile, '.' );
                    }

                    var file = files[0];

                    for (i = 0; i < file.users.length; i++) {
                        if (file.users[i] === missingUser) {
                            file.users.splice(i, 1);
                            file.save();
                            logger.info('update.js-updateHandler: Missing - Successful. Removed user with mac ', missingUser, ' from file with hash ', missingFile, '.' );
                            break;
                        }
                    }

	                
	                res.send({ 'status': 'OK', 'text': 'Missing Update complete' });

	            });
				return;
	        }


	    Pending.find({ 'transferID': parseFloat(tID), 'downloader': mac, 'uploader': uploaderMac }, { 'type': 1 }, function (error, relevantPending) {

	        if (relevantPending == undefined || relevantPending.length == 0) {
	            logger.error('Update request not completed. Reason - Cannot find pending to update. IP', req.ip);
	            res.send({ 'status': 'Error', 'text': 'Unable to find pending' });
	            return;
	        }

	        var type = relevantPending[0].type;

	        var updateLog = {}
	        if (type == 'secondleg')
	            updateLog["friend"] = uploaderMac;

	        var replications = 0;

	        console.log(type);

	        if (type == 'direct' || type == 'secondleg') {

	            Pending.find({ 'transferID': tID }, { 'uploader': 1, 'fileHash': 1, 'type': 1, 'downloader': 1 }, function (error, requests) {

	                Pending.remove({ "transferID": tID }, function (err, removed) {	// removes all pending transfer with id tID from pending 
	                    //logger.info("Update  type " + type + removed);
	                    console.log(removed);

	                    for (var i = 0; i < requests.length; i++) {

	                        if (requests[i].type == 'secondleg') { // adds entries to pending for deletion of replicated files.
	                            var newPending = new Pending();
	                            replications++;
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
	                        if (status == 'done') {
	                        	updateLog["type"] = "update";
	                        	updateLog["transferID"] = tID;
	                            updateLog["complete"] = true;
	                            updateLog["replications"] = replications;
	                            researchLogger.info(updateLog);
	                            logger.info('update.js-updateHandler: Update request completed. File transfer for direct, ' + downloader + ' has received file, made changes to pending')
	                        }
	                        else {
	                        	updateLog["type"] = "update";
	                        	updateLog["transferID"] = tID;
	                            updateLog["complete"] = false;
                                updateLog["replications"] = replications;
	                            researchLogger.info(updateLog);
	                            logger.info('update.js-updateHandler: Update request completed. File transfer for direct, ' + downloader + ' has cancelled file, made changes to pending')
	                        }
	                    else
	                        if (status == 'done') {
	                        	updateLog["type"] = "update";
	                        	updateLog["transferID"] = tID;
	                            updateLog["complete"] = true;
                                updateLog["replications"] = replications;
	                            researchLogger.info(updateLog);
	                            logger.info('update.js-updateHandler: Update request completed. File transfer for secondleg, ' + downloader + ' has received file, made changes to pending')
	                        }
	                        /*else {
	                        	updateLog["type"] = "Update";
	                        	updateLog["transferID"] = tID;
	                            updateLog["complete"] = false;
                                updateLog["replications"] = replications;
	                            researchLogger.info(updateLog);
	                            logger.info('update.js-updateHandler: Update request completed. File transfer for secondleg, ' + downloader + ' has cancelled file, made changes to pending')
	                        }*/
	                    res.send({ 'status': 'OK', 'text': 'Update Complete' });

	                });

	            });
	        }

	        if (type == 'firstleg') {


	            if (status == 'done') {

	                Pending.find({ 'transferID': tID, 'type': 'direct' }, function (error, request) {
	                	if(error || request.length == 0){
	                		res.send({ 'status': 'OK', 'text': 'Update Complete' });
	                		return;
	                	}

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
	                    //logger.info('update.js-updateHandler: Update request completed. File transfer for firstleg, ' + nick + ' has received file, added secondleg transfers to pending')
	                    console.log(newPending);

	                    Pending.remove({ "transferID": tID, 'downloader': mac, 'type': 'firstleg' }, function (err, removed) {
	                        console.log(removed);
	                        logger.info('update.js-updateHandler: Update request completed. File transfer for firstleg, ' + nick + ' has received file, added secondleg transfers to pending')
	                        res.send({ 'status': 'OK', 'text': 'Update Complete' });
	                    });

	                });
	            }
	            else {

	                Pending.remove({ "transferID": tID, 'downloader': mac, 'type': 'firstleg' }, function (err, removed) {
	                    console.log(removed);
	                    logger.info('update.js-updateHandler: Update request completed. File trasnsfer for firstleg, ' + mac + 'could not recieve file');
	                    res.send({ 'status': 'OK', 'text': 'Update Complete' });
	                });
	            }

	        }

	        if (type == 'delete') {

	            Pending.remove({ "transferID": tID, 'downloader': mac, 'type': 'delete' }, function (err, removed) {
	                console.log(removed);
	                logger.info('update.js-updateHandler: Update request completed. ' + mac + ' has deleted file.');
	                res.send({ 'status': 'OK', 'text': 'Update Complete' });
	            });

	        }


	    });

	});

}

exports.updateHandler = updateHandler;