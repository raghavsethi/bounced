var encryption = require('./encryption');

Pending = require('../models').Pending;

function downloadHandler(req, res) {

    var requestMac = req.body.mac;
    var requestFileHash = req.body.filehash;
    var requestFileName = req.body.filename;
    var requestType = req.body.type;
    
    User = require('../models').User;

    User.find({'ip' : ip}, function(error, users) {
    
        // Error checking
        //TODO: Check for error and multiple users for a single IP.

        var requestDownloader = users[0].mac;

        var newPending = new Pending();

        newPending.fileHash = requestFileHash;
        newPending.filename = requestFileName;
        newPending.uploader = requestMac;
        newPending.downloader = 
        newPending.transferID = encryption.generateNewId();
        newPending.symKey = encryption.generateNewKey();

        // Now behaviour will diverge depending on whether this is an online
        // or offline transfer

        // Online
        if (requestType.toLowerCase() === "direct") {
            newPending.online = true;
            newPending.type = "direct";
        }
            // Offline
        else {
            newPending.online = false;
            newPending.type = "firstleg";

            // Add 'pending's for x friends

            //TODO: Complete this method.
        }

        Pending.find({'mac' : newPending.mac, 'uploader': newPending.uploader, 'type' : newPending.type});

        newPending.save();

        res.send({ 'status': 'OK', 'text' : 'Download request accepted' })

    }

}

exports.downloadHandler = downloadHandler;