Pending = require('../models').Pending;

function updateHandler(req, res){

	var tID=req.body.transferID;
	var status=req.body.status;
	var newHash=req.body.newHash;

	User.find({ 'ip': req.ip }, function (error, users) {
		console.log("tid "+tID+" status "+status+" newHash "+newHash +" result "+users);
		if (users == undefined || users.length == 0) {
            console.log('Cannot find user with IP ' + req.ip);
            res.send({ 'status': 'Error', 'text': 'Cannot find user with IP ' + req.ip });
            return;
        }
		var mac=users[0].mac
		console.log(mac);
		Pending.find({'transferID':tID, 'downloader':mac},{'type':1},function(error, updatingClient){
			console.log(updatingClient);
			var type=updatingClient[0].type;
			console.log(type);
			
			if(type == 'direct' || type == 'secondleg'){
			
				Pending.find({'transferID': tID}, {'uploader':1, 'fileHash':1, 'type':1},function(error, requests){
				
					Pending.remove({"transferID": tID},function(err, removed){
						console.log(removed);
					});
					
					for(var i=0;i<requests.length;i++){
					
						if(requests[i].type=='secondleg')
						{
							var newPending = new Pending();
							newPending.fileHash = requests[i].fileHash;
							newPending.downloader=requests[i].uploader;
							newPending.transferID=tID;
							newPending.type='delete';
							
							newPending.save();
							console.log("Pending to delete file added");
							console.log(newPending);
						}
					}	
					res.send({'status': 'OK', 'text':'Update Complete'});
					
					
				
				});
			}
			
			if(type == 'firstleg'){
				
				
				if(status == 'done'){
					
					Pending.find({'transferID': tID, 'type':'direct'}, function(error, request){
						console.log("here");
								
						var newPending = new Pending();
						newPending.fileHash = newHash;
						newPending.downloader=request[0].downloader;
						newPending.uploader=mac;
						newPending.fileName=request[0].fileName;
						newPending.fileName=request[0].fileName;
						newPending.transferID=tID;
						newPending.type='secondleg';
						
						newPending.save();
						console.log("Pending to delete file added");
						console.log(newPending);
					});		
				}
				
				Pending.remove({"transferID": tID, 'downloader':mac, 'type':'firstleg'},function(err, removed){
					console.log(removed);
					res.send({'status': 'OK', 'text':'Update Complete'});
				});
					
			}
			
			if(type == 'delete'){
			
				Pending.remove({"transferID": tID, 'downloader':mac, 'type':'delete'},function(err, removed){
					console.log(removed);
					res.send({'status': 'OK', 'text':'Update Complete'});
				});
					
			}
			
			
		});
		
	});

}





exports.updateHandler = updateHandler;