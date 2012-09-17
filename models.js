var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/test');
var Schema = mongoose.Schema;

var Pending = new Schema({
    fileName    : String
  , Uploader    : String
  , hash        : String
  , transferID  : Number
  , symKey      : String
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

var Files = new Schema({
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

exports.User = User;
exports.File = File;
