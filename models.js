var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/test');
var Schema = mongoose.Schema;

var UserSchema = new Schema({
    nick	: String
  , mac		: String
  , ip		: String
  , online	: Boolean
});

var User = mongoose.model('User', UserSchema);

exports.User = User;
