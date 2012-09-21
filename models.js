var mongoose = require('mongoose');
var Schema = mongoose.Schema;

mongoose.connect('mongodb://localhost/test');

/* Pending 'type' values
   ---------------------

   'direct'     (from person with the file to the person who wants the file)
   'indirect'   (from person with the file to a friend of the requestor)
   'bounce'     (from a friend who has the file to the person who wanted the file)
   'delete'     (instruction to delete a file being held for a friend)
*/

var PendingSchema = new Schema({
    fileName    : String
  , uploader    : String
  , hash        : String
  , transferID  : Number
  , symKey      : String
  , type        : String
});

var UserSchema = new Schema({
    mac             : Schema.Types.ObjectId
  , ip     			: String
  , nick      		: String
  , spaceAllocated 	: Number
  , state 			: Boolean
  , pending  		: [Pending]
  , dataUploaded 	: Number
  , dataDownloaded 	: Number
});

var FileSchema = new Schema({
    hash    : Schema.Types.ObjectId
  , name    : String
  , size    : String
  , users 	: [User]
  , meta    : {
      keyword : String
  }
});

var FriendSchema = new Schema({
    friend1 : String
  , friend2 : String
  , count   : Number
});

var User = mongoose.model('User', UserSchema);
var File = mongoose.model('File', FileSchema);
var Pending = mongoose.model('Pending', PendingSchema);

exports.User = User;
exports.File = File;
exports.Pending = Pending;