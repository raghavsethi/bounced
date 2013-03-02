var encryption = require('./encryption');
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

Pending = require('../models').Pending;
Friendship = require('../models').Friendship;

function downloadHandler(req, res) {

    var requestMac = req.body.mac;
    var requestFileHash = req.body.filehash;
    var requestFileName = req.body.filename;
    var requestFileSize = req.body.filesize;
    var requestType = req.body.type;
    
    User = require('../models').User;

    User.find({ 'ip': req.ip }, function (error, users) {

        if (error) {
            logger.warn('download.js-downloadHandler: Download request not completed. Reason - Cannot find user with IP ' + req.ip);
            res.send({ 'status': 'Error', 'text': error });
            return;
        }

        var requestDownloader = users[0].mac;

        var newPending = new Pending();

        newPending.fileHash = requestFileHash;
        newPending.fileName = requestFileName;
        newPending.fileSize = requestFileSize;
        newPending.uploader = requestMac;
        newPending.downloader = requestDownloader;
        newPending.transferID = encryption.generateNewId();
        newPending.symKey = encryption.generateNewKey();
        newPending.uploaderIP = "invalid";
        newPending.nick = 'He Who Must Not Be Named';
        newPending.type = "direct";


        // Now behaviour will diverge depending on whether this is an online
        // or offline transfer

        var bounced = []; // Will hold the firstleg pendings

        if (requestType.toLowerCase() == "bounced") {

            // Find all the people with whom the downloader is friends
            Friendship.find({ $or: [{ 'friend1': requestDownloader }, { 'friend2': requestDownloader}] }, {}, { limit: 5, sort: [['count', 'desc']] }, function (error, friends) {

                //logger.info('download.js-downloadHandler: friends are  ' + friends);

                for (var i = 0; i < friends.length; i++) {

                    var bouncedPending = new Pending();

                    bouncedPending.fileHash = requestFileHash;
                    bouncedPending.fileName = requestFileName;
                    bouncedPending.transferID = newPending.transferID;
                    bouncedPending.fileSize = requestFileSize;
                    bouncedPending.uploader = requestMac;

                    if (friends[i].friend1 == requestDownloader) {
                        bouncedPending.downloader = friends[i].friend2;
                    } else {
                        bouncedPending.downloader = friends[i].friend1;
                    }

                    // Make sure downloader and uploader are not the same person
                    if (bouncedPending.downloader == requestMac)
                        continue;

                    bouncedPending.uploaderIP = "invalid";
                    bouncedPending.nick = 'He Who Must Not Named';
                    bouncedPending.type = "firstleg";
                    bounced.push(bouncedPending);
                }

                //logger.info("download.js-downloadHandler:  List of firstleg pendings " + bounced);

                // To ensure duplicate download requests are not processed
                Pending.find({ 'fileHash': newPending.fileHash, 'uploader': newPending.uploader, 'type': newPending.type }, function (error, pendingUsers) {
                    if (error == null) {
                        if (pendingUsers.length == 0) {
                            newPending.save();

                            for (var i = 0; i < bounced.length; i++) {
                                bounced[i].save();
                            }

                            logger.info('download.js-downloadHandler:Download request completed. Added pending to  ' + users[0].nick + ' with type = direct and ' + bounced.length + ' pending(s) with type = firstleg ');
                            res.send({ 'status': 'OK', 'text': 'Download request accepted' });

                        } else {

                            logger.info('download.js-downloadHandler: Download request not completed. Reason - This download has already been requested');
                            res.send({ 'status': 'Error', 'text': 'This download request already exists' });
                            return;
                        }

                    } else {
                        logger.error('download.js-downloadHandler: Download request not completed. Reason -  Could not read pendings from DB. IP', req.ip);
                        res.send({ 'status': 'Error', 'text': error });
                        return;
                    }
                });
            });

        } else {

            Pending.find({ 'fileHash': newPending.fileHash, 'uploader': newPending.uploader, 'type': newPending.type }, function (error, pendingUsers) {
                if (error != null) {
                    logger.error('download.js-downloadHandler: Download request not completed. Reason -  Could not read pendings from DB. IP', req.ip);
                    res.send({ 'status': 'Error', 'text': error });
                    return;
                }

                // To ensure duplicate download requests are not processed
                if (pendingUsers.length == 0) {
                    newPending.save();

                    for (var i = 0; i < bounced.length; i++)
                        bounced[i].save();

                    logger.info('download.js-downloadHandler: Download request complete Added pending to  ' + users[0].nick + ' with type = direct and ' + bounced.length + ' pending(s) with type = firstleg ');
                    var downloadLog = {}
                    downloadLog["tID"] = newPending.transferID;
                    downloadLog["downloader"] = newPending.downloader;
                    downloadLog["uploader"] = newPending.uploader;
                    downloadHandler["fileSize"] = newPending.fileSize;
                    researchLogger.info(downloadHandler);
                    res.send({ 'status': 'OK', 'text': 'Download request accepted' });

                } else {
                    logger.info('download.js-downloadHandler: Download request not completed. Reason - This download has already been requested');
                    res.send({ 'status': 'Error', 'text': 'This download request already exists' });
                    return;
                }
            });
        }
    });
}

exports.downloadHandler = downloadHandler;