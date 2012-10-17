var mongoose = require('mongoose');
var Schema = mongoose.Schema;

mongoose.connect('mongodb://localhost/test');

/* Pending 'type' values
   ---------------------

   'direct'     (from person with the file to the person who wants the file)
   'firstleg'   (from person with the file to a friend of the requestor)
   'secondleg'  (from a friend who has the file to the person who wanted the file)
   'delete'     (instruction to delete a file being held for a friend)
*/

var PendingSchema = new Schema({
    transferID  : Number
  , uploader    : String
  , downloader  : String
  , fileHash    : String
  , fileName    : String
  , fileSize    : Number
  , symKey      : String
  , type        : String
  , uploaderIP  : String 
  , nick        : String
});

var UserSchema = new Schema({
    mac             : String
  , ip     			: String
  , nick      		: String
  , spaceAllocated 	: Number
  , online 			: Boolean
  , dataUploaded 	: Number
  , dataDownloaded  : Number
});

var FileSchema = new Schema({
    hash    : String
  , name    : String
  , size    : Number
  , type    : String
  , users 	: [String]
  , keywords: [String]
});

var FriendshipSchema = new Schema({
    friend1: String
  , friend2: String
  , count: Number
});


var User = mongoose.model('User', UserSchema);
var File = mongoose.model('File', FileSchema);
var Pending = mongoose.model('Pending', PendingSchema);
var Friendship = mongoose.model('Friendship', FriendshipSchema);

exports.User = User;
exports.File = File;
exports.Pending = Pending;
exports.Friendship = Friendship;