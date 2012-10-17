var encryption = require('./encryption');

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

        // Error checking
        //TODO: Check for error and multiple users for a single IP.

        var requestDownloader = users[0].mac;

        var newPending = new Pending();

        newPending.fileHash = requestFileHash;
        newPending.fileName = requestFileName;
        newPending.fileSize = requestFileSize;
        newPending.uploader = requestMac;
        newPending.downloader = requestDownloader;
        //newPending.transferID = encryption.generateNewId();
        newPending.symKey = encryption.generateNewKey();
        newPending.uploaderIP = "invalid";
		newPending.nick = 'He Who Must Not Named';
		newPending.type = "direct";
        //newPending.save();
		// Now behaviour will diverge depending on whether this is an online
        // or offline transfer

        // Online
		var bounced=[];
        if (requestType.toLowerCase() == "bounced") {
            console.log("HERE");
			Friendship.find({$or: [{ 'friend1': requestDownloader },{ 'friend2': requestDownloader }]},{},{limit:1, sort:[['count','desc']]}, function(error, friends){
				console.log("Determined Friends");
				for(var i=0;i<friends.length;i++){
				
					var bouncedPending = new Pending();
					bouncedPending.fileHash = requestFileHash;
					bouncedPending.fileName = requestFileName;
					bouncedPending.fileSize = requestFileSize;
					bouncedPending.uploader = requestMac;
					if(friends[0].friend1 == requestMac)
						bouncedPending.downloader = friends[0].friend2;
					else
						bouncedPending.downloader = friends[0].friend1;
					bouncedPending.uploaderIP = "invalid";
					bouncedPending.nick = 'He Who Must Not Named';
					bouncedPending.type = "firstleg";
					console.log(bouncedPending)
					bounced.push(bouncedPending);
				
				}
        
			});
			
		}
		        

        Pending.find({ 'fileHash': newPending.fileHash, 'uploader': newPending.uploader, 'type': newPending.type }, function (error, users) {
            if (error == null) {
                if (users.length == 0) {
                    newPending.save();
					for(var i=0; i<bounced.length;i++)
						bounced[i].save();
                    res.send({ 'status': 'OK', 'text': 'Download request accepted' })
                }
                else {
                    res.send({ 'status': 'Error', 'text': 'This download request already exists' })
                    return;
                }
            }
            else {
                res.send({ 'status': 'Error', 'text': error });
                return;
            }
        });

    });

}

exports.downloadHandler = downloadHandler;