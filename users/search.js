var url = require("url");
var winston = require('winston');
File=require('../models').File;
var logger = new (winston.Logger)({
    transports: [
      new (winston.transports.Console)(),
      new (winston.transports.File)({ filename: 'searchQueries.log',json:false })
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
	
	/*File.find(query,function(error, files) {
		var result=[];
		score = {};
		for (var i=0;i<files.length;i++){
			high=0;
			low=0;
			var name = files[i].name.toLowerCase();
			name = name.split(/[. -]/);
			//console.log(name);
			for(j=0;j<words.length;j++){
				//console.log(words[j])
				if(name.indexOf(words[j])>0){
					high++;
					//console.log(words[j]);
				}
				else
					if(files[i].keywords.indexOf(words[j])>-1)
						low++;
			}
			score[files[i]] = high*1.1+low*1.0;
		}
		//console.log(score);

		var rankedFiles = []
		for (var file in score)
			rankedFiles.push([file, score[file]]);
		rankedFiles.sort(function(a, b) {return b[1] - a[1]});
		asyncFor(rankedFiles.length, function(loop) {  
			var i=loop.iteration();
			userList=files[i].users;
			console.log(userList)
			loop.next();
		},
		function(){
            //console.log('search results for '+pathname);
		    //console.log(result);
			logger.info("found " + result.length + " results for query " + pathname + " made by " + req.ip);
		    res.send(result);
		});
		
		
		
		//res.send(rankedFiles);
	
	
	});*/
	File.find(query, function (error, files) {
		var result=[];
		var userList=[];
        if (files == undefined ||files.length==0) {
			logger.info("search.js-searchHandler: No file found for query " + pathname + " made by " + req.ip);
            //console.log('No such file');
			res.send(result);
        }
		else{
			//console.log(files);
			for (var i=0;i<files.length;i++){
				score=0;
				var name = files[i].name.toLowerCase();
				name = name.split(/[. -]/);
				//console.log(name);
				for(j=0;j<words.length;j++){
					//console.log(words[j])
					if(name.indexOf(words[j])>0){
						score+=1.1;
						//console.log(words[j]);
					}
					else
						if(files[i].keywords.indexOf(words[j])>-1)
							score=+1.0;
				}
				files[i].score = score;
			}
			files.sort(function(a, b) {return b.score - a.score});
			results=[]
			console.log(files);
			asyncFor(files.length, function(loop) {  
				var i=loop.iteration();
				console.log(i);
				console.log(files[i]);	
				console.log(typeof files[i]);
				userList=files[i].users;
				console.log(userList);
				User.find({'mac': {$in:userList}},{'mac':1,'nick':1,'online':1},function (error,users) {
					console.log(users);
					asyncFor(users.length, function(loop2) {
						var j = loop2.iteration();
						var online;
						if(users[j].online==true)
							online=true;
						else
							online=false;
						var temp= { 'name':files[i].name, 'hash':files[i].hash, 'mac':users[j].mac, 
						'nick':users[j].nick, 'size':files[i].size, 'type':files[i].type, 'online': online, 'score':files[i].score};
						result.push(temp);
						
						loop2.next();
					},
					function() {
						loop.next()
					});
				});

				},
				function(){
					//console.log('search results for '+pathname);
					//console.log(result);
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