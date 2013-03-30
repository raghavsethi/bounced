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
	if(pathname.length>4)
		if(pathname.slice(0,4) == "user"){
			//var userResults = [];
			getResultsByUser(pathname.slice(5,pathname.length),req,res);
			//console.log(userResults);
			//res.send(userResults);
			return;
		}
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
			logger.info("search.js-searchHandler: Search results returned. Found 0 files for query " + pathname + ". IP " + req.ip);
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
					for(var k in name){
						//console.log(name[k],words[j]);
						if(name[k] == words[j]){
								score+=2.1;
								break;
								//console.log(score);
						}
						else{
							if(name[k].match('^'+words[j])==words[j]){
								score+=1.05;
								//console.log(score);
							}
							
						}
					
					}
					var keywords = files[i].keywords;
					for(var k in keywords){
						//console.log(keywords[k],words[j]);
						if(keywords[k] == words[j]){
								score+=1.0;
								//console.log(score);
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
					if(result.length>500)
						result=result.slice(0,500);
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


function getResultsByUser(username,req,res){
	User.find({'nick': username},{'mac':1,'online':1,'nick':1},function (error,users) {
		var result = [];
		if (users == undefined ||users.length==0) {
			logger.info("search.js-searchHandler: Search results returned. Found 0 files for query " + username + ". IP " + req.ip);
			res.send(result);
			return;
        }
		var userMac = users[0].mac;
		var userOnline = users[0].online;
		var userNick = users[0].nick;
		var query = {};
		query["$or"]= [];
		query["$or"].push({ 'users': userMac });
		var result = [];
		console.log(query);
		//db.article.find({_keywords: {$in: ['foo1', 'foo2']}})
		File.find(query,function (error,files) {
			//console.log(files);
			for (var i = 0; i < files.length; i++) {
				var temp= { 'name':files[i].name, 'hash':files[i].hash, 'mac':userMac, 'nick':userNick, 'size':files[i].size, 'type':files[i].type, 'online': userOnline};
				result.push(temp);
			};			
			//console.log(result);
			//return result;
			res.send(result);
			return;

		});



	});

}



exports.searchHandler =searchHandler;
exports.asyncFor =asyncFor;