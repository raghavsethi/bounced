var encryption = require('./encryption');

Pending = require('./models').Pending;

function requestFileHandler(req, res) {

    var requestMac = req.body.mac;
    var requestHash = req.body.hash;
    var requestFileName = req.body.filename;
    var requestType = req.body.type;

    var newPending = new Pending();

    newPending.filename = requestFileName;
    newPending.uploader = requestUser;
    newPending.transferID = encryption.generateNewId();
    newPending.symKey = encryption.generateNewKey();

    // Now behaviour will diverge depending on whether this is an online
    // or offline transfer.

    // Online
    if(requestType.toLower() === "online") {
        newPending.
}