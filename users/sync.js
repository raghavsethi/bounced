File=require('../models').File;
var winston = require('winston');
totalRemoved = 0; //Used to synchronise addition to be after removal
addedData = {}

var syncLogger = new (winston.Logger)({
    transports: [
      new (winston.transports.Console)(),
      new (winston.transports.File)({ filename: 'sync.log', json:false})
    ]
});

function syncHandler(req, res, onlineUsers) {
    totalRemoved = 0;
    addedData = JSON.parse(req.body.added);
    var removedData = JSON.parse(req.body.removed);
    var addedItems = [];
    var removedItems = [];
    

    User.find({ 'ip': req.ip }, function (error, users) {

        if (users == undefined || users.length == 0) {
            console.log('Cannot find user with IP ' + req.ip);
            res.send({ 'status': 'Error', 'text': 'Cannot find user with IP ' + req.ip });
            return;
        }

        var totalRemoved = 0;
        for (var key in removedData)
            syncLogger.info(removedData[key].name);
            totalRemoved = totalRemoved++;

        if (totalRemoved == 0) {
            console.log("0 files removed. Adding new files only.");

            for (var key in addedData) {
                if (addedData.hasOwnProperty(key)) {
                    addedItems.push(addedData[key].name);
                    addFile(addedData[key], users[0]);
                }
            }
            syncLogger.info("Additions for " + req.ip + " " + addedItems);
            syncLogger.info("Removals for " + req.ip + " " + removedItems);

            res.send({ 'status': 'OK', 'text': 'Sync successful' });

            return;
        }

        for (var key in removedData) {
            if (removedData.hasOwnProperty(key)) {
                removedItems.push(removedData[key].name);
                removeFile(removedData[key], users[0], totalRemoved);
            }
        }

        //pendingLogger.info(addedItems);

        syncLogger.info("Additions for " + req.ip + "\n---------");
        syncLogger.info(addedItems);
        syncLogger.info("Removals for " + req.ip + "\n--------");
        syncLogger.info(removedItems);
        res.send({ 'status': 'OK', 'text': 'Sync successful' });
    });
}

function removeFile(fileInfo, user, totalRemoved) {
    File.find({ 'hash': fileInfo.hash }, function (error, files) {

        if (files.length == 0) {
            console.log("File not found in DB : " + fileInfo.name);
            return;
        }

        if (files[0].users.length == 1) {
            files[0].remove();
            console.log("Removed file from DB : " + fileInfo.name);
        }

        var file = files[0];

        for (i = 0; i < file.users.length; i++) {
            if (file.users[i] === user.mac) {
                file.users.splice(i, 1);
                file.save();
                console.log("Removed user from file : " + fileInfo.name);
                break;
            }
        }

        totalRemoved--;

        if (totalRemoved == 0) {

            console.log("File removal complete. Beginning addition..");

            for (var key in addedData) {
                if (addedData.hasOwnProperty(key)) {
                    addFile(addedData[key], users[0]);
                }
            }
        }

    });
}

function addFile(fileInfo, user) {
    File.find({ 'hash':fileInfo.hash }, function(error, files) {
        
        // New file
        if(files.length==0) {
            console.log("Adding file : " + fileInfo.name);
            
            var newFile = new File();
            newFile.hash = fileInfo.hash;
            newFile.name = fileInfo.name;
            newFile.type = fileInfo.type;
            newFile.size = fileInfo.size;
            newFile.users = [user.mac];
            newFile.keywords = fileInfo.keywords;

            newFile.save();
            return;    
        }

        var file = files[0];
        
        console.log("Updating file: " + fileInfo.name);

        if(file.users.indexOf(user.mac)==-1) {
            file.users.push(user.mac);
            file.save();
        }


    });
}

exports.syncHandler = syncHandler;