var url = require("url");
var winston = require('winston');
File=require('../models').File;
var logger = new (winston.Logger)({
    transports: [
      new (winston.transports.Console)(),
      new (winston.transports.File)({ filename: 'searchQueries.log' })
    ]
});

function searchHandler(req,res){
	var pathname = req.params.query;
	logger.info("IP: "+req.ip+" Query"+pathname);
	console.log(pathname+"ghj");
	File.find({ 'keywords': pathname }, function (error, files) {
		var result=[];
		var userList=[];
        if (files == undefined ||files.length==0) {
            console.log('No such file');
			res.send(result);
        }
		else{
			asyncFor(files.length, function(loop) {  
				var i=loop.iteration();
				userList=files[i].users;

				User.find({'mac': {$in:userList}},{'mac':1,'nick':1,'online':1},function (error,users) {					
					asyncFor(users.length, function(loop2) {
						var j = loop2.iteration();
						var online;
						console.log(users[j].online);
						if(users[j].online==true)
							online=true;
						else
							online=false;
						var temp= { 'name':files[i].name, 'hash':files[i].hash, 'mac':users[j].mac, 
                        'nick':users[j].nick, 'size':files[i].size, 'type':files[i].type, 'online': online};

						result.push(temp);
						loop2.next();
					},
					function() {
						loop.next()
					});
				});
				
				},
				function(){
                    console.log('search results for '+pathname);
				    console.log(result);
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