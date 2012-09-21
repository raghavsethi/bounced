var encryption = require('./encryption');

Pending = require('../models').Pending;

function downloadHandler(req, res) {

    var requestMac = req.body.mac;
    var requestHash = req.body.hash;
    var requestFileName = req.body.filename;
    var requestType = req.body.type;

    var newPending = new Pending();

    newPending.filename = requestFileName;
    newPending.uploader = requestMac;
    newPending.transferID = encryption.generateNewId();
    newPending.symKey = encryption.generateNewKey();

    // Now behaviour will diverge depending on whether this is an online
    // or offline transfer

    // Online
    if (requestType.toLowerCase() === "online") {
        newPending.online = true;
        newPending.save();
    }
    // Offline
    else {
        newPending.online = false;
        newPending.save();

        // Add 'pending's for x friends

        //TODO: Complete this method.
    }

    res.send({ 'status': 'Download request accepted' })

}

exports.downloadHandler = downloadHandler;