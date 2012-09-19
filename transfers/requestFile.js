
function requestFileHandler(req, res) {

    var requestMac = req.body.mac;
    var requestHash = req.body.hash;
    var requestFileName = req.body.filename;

    var Pending = require('./models').Pending;

    var newPending = new Pending();

    newPending.filename = requestFileName;
    newPending.uploader = requestUser;

transferID  : Number
symKey      : String

}