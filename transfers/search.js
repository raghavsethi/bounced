// serach.js contains the searhcHandler which is called once a /search message is POSTed by the client
var url = require("url");
var winston = require('winston');
File=require('../models').File;
var logger = new (winston.Logger)({
    transports: [
      new (winston.transports.Console)(),
      new (winston.transports.File)({ filename: 'searchQueries.log',json:false, timestamp: function() { return (new Date());}})
    ]
});

function searchHandler(req,res){
	var pathname = req.params.query; // The search query bin the form of: "the+big+bang+theory" is recieved
	pathname = pathname.toLowerCase();
	var words = pathname.split('+');
	var query = {};
	query["$or"]=[];
	score={};
	// The array query contains the serach query words
	for(var k=0; k<words.length;k++){
		query["$or"].push({ 'keywords': words[k] });
	}
	console.log(query); //query is logged
	// Searching for file with the given query
	File.find(query, function (error, files) {
		var result=[];
		var userList=[];
        if (files == undefined ||files.length==0) {
			logger.info("search.js-searchHandler: Search results returned. Found 0 files for query " + pathname + ". IP " + req.ip);
			res.send(result);
        }
		else{
			String.prototype.startsWith = function(str) 
				{return (this.match("^"+str)==str);}
			for (var i=0;i<files.length;i++){
				score=0;
				var name = files[i].name.toLowerCase();
				name = name.split(/[. -]/); // Creating array of the words in the file name
				for(j=0;j<words.length;j++){
					console.log(name);
					for(var k in name){
						console.log(name[k],words[j]);
						if(name[k] == words[j]){
								score+=1.1;  //Incase of a direct match of a word in 
											 //the search query and the file name.
								console.log(score);
						}
						else{
							if(name[k].match('^'+words[j])==words[j]){
								score+=1.05;  // Incase their is match in the leading 
											  //charatcter sequences.Example: 
											  //"earth is round".match('^'+"earth")=="earth" returns TRUE
								console.log(score);
							}
							
						}
					
					}
					var keywords = files[i].keywords;
					for(var k in keywords){
						console.log(keywords[k],words[j]); // Finally a simple keyword matching. Each file is associated with a set of keywords.
						if(keywords[k] == words[j]){
								score+=1.0;
								console.log(score);
						}
						
					
					}
				}
				files[i].score = score; //Score stored in the files object
			}
			files.sort(function(a, b) {return b.score - a.score});
			results=[]
			// Using an asyncronous for to find the list of online users who have the query matching files
			// and then sending the file objects in descending order of score.
			asyncFor(files.length, function(loop) {  
				var i=loop.iteration();
				userList=files[i].users;
				score = 0;
				User.find({'mac': {$in:userList}},{'mac':1,'nick':1,'online':1},function (error,users) {
					asyncFor(users.length, function(loop2) {
						var j = loop2.iteration();
						var online;
						if(users[j].online==true){
							online=true;
							score = files[i].score+2.0;
						}
						else{
							online=false;
							score = files[i].score
						}
						var temp= { 'name':files[i].name, 'hash':files[i].hash, 'mac':users[j].mac, 
						'nick':users[j].nick, 'size':files[i].size, 'type':files[i].type, 'online': online, 'score':score};
						result.push(temp);
						
						loop2.next();
					},
					function() {
						loop.next()
					});
				});

				},
				function(){
					result.sort(function(a, b) {return b.score - a.score});
					logger.info("search.js-searchHandler: Search results returned. Found "+ results.length +" files for query " + pathname + " . IP " + req.ip);
					res.send(result);
				}
			);
			
		}
	});
	
}


function asyncFor(iterations, func, callback) {
    var index = 0;
    var done = false;
    var loop = {
        next: function() {
            if (done) {
                return;
            }

            if (index < iterations) {
                index++;
                func(loop);

            } else {
                done = true;
                callback();
            }
        },

        iteration: function() {
            return index - 1;
        },

        break: function() {
            done = true;
            callback();
        }
    };
    loop.next();
    return loop;
}


exports.searchHandler =searchHandler;
exports.asyncFor =asyncFor;