var mongoose = require('mongoose');
var db = mongoose.createConnection('localhost', 'test');
  
db.on('error', console.error.bind(console, 'connection error:'));

db.once('open', function () {
	
	var kittySchema = new mongoose.Schema({
		name: String
	})
	
	var Kitten = db.model('Kitten', kittySchema)
	var silence = new Kitten({ name: 'Silence' })
	console.log(silence.name);
	silence.save();
	console.log(silence);

});