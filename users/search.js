var url = require("url");
File=require('../models').File;

function searchHandler(req,res){
	var pathname = url.parse(req.url).query;
	pathname = pathname.replace(/\+/g," ");
	console.log("Request for " + pathname + " received.");
	var search="/"+pathname+"/";
	File.find({ 'name': pathname }, function (error, files) {
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
				var temp2=[];
				
				//temp.push(files[i].name);
				//temp.push(files[i].hash);
				User.find({'mac': {$in:userList}},{'ip':1,'nick':1},function (error,users) {					
					asyncFor(users.length, function(loop2) {
						var j = loop2.iteration();
						//temp2.push(users[j].ip);
						//temp2.push(users[j].nick);
						temp2.push({'ip':users[j].ip,'nick':users[j].nick});
						loop2.next();
						},
						function(){
						var temp={'name':files[i].name, 'hash':files[i].hash, 'users':temp2};
						result.push(temp);
						loop.next()
						}								
					);
				});
				
				},
				function(){console.log('search results for '+pathname);
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