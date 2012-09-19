var mongoose = require('mongoose');
var Schema = mongoose.Schema;

mongoose.connect('mongodb://localhost/test');

var PendingSchema = new Schema({
    fileName    : String
  , uploader    : String
  , hash        : String
  , transferID  : Number
  , symKey      : String
  , online      : Boolean
});

var UserSchema = new Schema({
    mac             : ObjectId
  , ip     			: String
  , nick      		: String
  , spaceAllocated 	: Number
  , state 			: Boolean
  , pending  		: [Pending]
  , dataUploaded 	: Number
  , dataDownloaded 	: Number
});

var FileSchema = new Schema({
    hash	: ObjectId
  , name    : String
  , size    : String
  , users 	: [Users]
  , meta    : {
      keyword : String
  }
});

var User = mongoose.model('User', UserSchema);
var File = mongoose.model('File', FileSchema);
var Pending = mongoose.model('Pending', PendingSchema);

exports.User = User;
exports.File = File;
exports.Pending = Pending;