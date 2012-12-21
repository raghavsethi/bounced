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
	var pathname = req.params.query;
	pathname = pathname.toLowerCase();
	var words = pathname.split('+');
	var query = {};
	query["$or"]=[];
	score={};
	for(var k=0; k<words.length;k++){
		query["$or"].push({ 'keywords': words[k] });
	}
	console.log(query);
	
	File.find(query, function (error, files) {
		var result=[];
		var userList=[];
        if (files == undefined ||files.length==0) {
			logger.info("search.js-searchHandler: No file found for query " + pathname + " made by " + req.ip);
			res.send(result);
        }
		else{
			String.prototype.startsWith = function(str) 
				{return (this.match("^"+str)==str);}
			for (var i=0;i<files.length;i++){
				score=0;
				var name = files[i].name.toLowerCase();
				name = name.split(/[. -]/);
				for(j=0;j<words.length;j++){
					console.log(name);
					for(var k in name){
						console.log(name[k],words[j]);
						if(name[k] == words[j]){
								score+=1.1;
								console.log(score);
						}
						else{
							if(name[k].match('^'+words[j])==words[j]){
								score+=1.05;
								console.log(score);
							}
							
						}
					
					}
					var keywords = files[i].keywords;
					for(var k in keywords){
						console.log(keywords[k],words[j]);
						if(keywords[k] == words[j]){
								score+=1.0;
								console.log(score);
						}
						
					
					}
				}
				files[i].score = score;
			}
			files.sort(function(a, b) {return b.score - a.score});
			results=[]
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
					logger.info("found " + result.length + " results for query " + pathname + " made by " + req.ip);
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