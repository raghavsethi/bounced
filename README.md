Bounced
=======

Server for the Bounce file-sharing network. Client is [here](http://www.github.com/raghavsethi/bounce-client/)

Recommended Development Environment
-----------------------
1. [Microsoft WebMatrix](http://www.microsoft.com/Web/webmatrix/node.aspx) 
2. GitHub for Windows 
3. Node.js 
4. MongoDB ([set up](http://docs.mongodb.org/manual/tutorial/install-mongodb-on-windows/) [manual](reading about mongo: http://docs.mongodb.org/manual/) 
5. [POSTman](https://chrome.google.com/webstore/detail/fdmmgilgnpjigdojojpjoooidkmcomcm) 

Packages and tutorials
----------------------

Packages: 
1. Express ([tutorial](http://dailyjs.com/2010/11/08/node-tutorial-2/)) 
2. Mongoose ([tutorial](http://www.bloggedbychris.com/2012/06/20/windows-7-restful-web-service-node-js-express-mongodb/)) 
3. Winston ([tutorial](http://thechangelog.com/post/2844869169/winston-a-multi-transport-async-logging-library-for-node))
4. Winston-MongoDB 
5. Forever ([source](https://github.com/nodejitsu/forever)) 

Tutorials: 
1. Control flow: http://howtonode.org/control-flow 
2. Passing parameters to callbacks: http://stackoverflow.com/questions/939032/jquery-pass-more-parameters-into-callback 
3. Closures: http://web.archive.org/web/20080209105120/http://blog.morrisjohns.com/javascript_closures_for_dummies 

General Architecture
------------------

###Keeping track of online users
HTTP pings to /pending

###Authentication
MAC is the primary key, still not sure how to prevent spoofing of the HTTP post

###Server-initiated transfers, peer-initiated transfers
Every client will listen on a port for server commands

###Network protocol
HTTP, as that is well-supported by Node and is easily debuggable in the browser and via Fiddler

###Data transfer
JSON.

###Encryption over the wire
HTTPS, yet to obtain certificate.

###Encryption on disk for friend-files
Could use the hash of the file as the encryption key, this would make life very easy as the requesting peer only needs to know the hash - which is anyway the primary key for a file. To be implemented.

###Encryption for standard transfers
Don't think this is worth the time and complexity, MITM can simply be prevented by using the comparing against the expected hash

###Local storage
Currently a config file, will move to VS-default config soon

###Distribution of network-specific configuration
Hardcode the common server into the distributable. Give server address on download web-page.

###Failover/Load sharing
Will be implemented later.

###Update/Deployment mechanism
ClickOnce

API
---

###GET /pending 
**Request Body** None 
**Response Body** `[{'uploader':XYZ, 'type':'indirect'...},]` (apart from everything in pending - this must return IP of uploader as well) 
**Client Action** Repeated every 'x' seconds 
**Server Action** Reset the timeout at which the server will mark the user offline   

###GET /search/the+big+bang+theory 
**Request Body** None  
**Response Body** `[{'uploader':XYZ, 'mac':'XYZ', 'type':'online', 'hash':XYZ, 'size':1234, ...},]`
**Client Action** When user searches for a file  
**Server Action** Return list of matching files 

###GET /key/transferID 
**Request Body** None  
**Response Body** `{'key':XYZ} ` 
**Client Action** When a client recieves a request to serve a file 
**Server Action** Return the key for a transferID 

###GET /status 
**Request Body** None  
**Response Body** `[{'transferId':XYZ, 'hash':XYZ, 'mac': XYZ, 'sent': 2, 'total': 5},]` 
**Client Action** Every x seconds, display on the 'bounces' tab 
**Server Action** Compute which transferIDs have what status 

###POST /register 
**Request Body** `mac=XYZ, nick=XYZ, space_allocated=265348` 
**Response Body** `{'status': 'OK', 'text':'xyz'}` 
**Client Action** Application start  
**Server Action** Mark user as online and start the timeout 

###POST /download 
**Request Body** `hash=XYZ, mac=XYZ, type=online` 
**Response Body** `{'status': 'OK', 'text':'xyz'}`  
**Client Action** User click on 'download' or 'bounce' button 
**Server Action** Populate the pending queue appropriately 

###POST /sync 
**Request Body** `added=[{'name':'file1'...}]` 
**Response Body** `{'status': 'OK', 'text':'xyz'}` 
**Client Action** Client finishes calculating diffs   
**Server Action** Make appropriate changes to file table  

###POST /update 
**Request Body** `transferID=XYZ, status=canceled/done/hash_mismatch, [newHash=XYZ], [uploader=XYZ]` 
**Response Body** `{'status': 'OK', 'text':'xyz'}` 
**Client Action** Client cancels or completes download 
**Server Action** Modify the pending queue appropriately 

Simple download protocol
------------------------

###Client initiates download
1. User selects a file and selects 'download'/'bounce'
2. Client makes request to /download with mac, hash, type
3. If the file is 'online', the server creates 1 entry in the pending table from uploader to downloader. Otherwise, it will also create 'x' entries for the user's friends to download the file.

Use cases
---------
1. User downloads file directly, file remains online throughout
2. User requests offline file, file is replicated, downloaded from original holder
3. User requests offline file, file is replicated, downloaded from friend
4. Node is instructed to download file for friend
5. Node is instructed to download file for itself
6. User changes nick - only on next restart
7. Sync is initiated - only on explicit call
8. User becomes offline
9. Transfer is completed
10. Transfer failed
11. Friend loses file it has downloaded
12. User receives file, and other nodes are still holding file for user
13. User never comes online to receive the file
14. Transfer is restarted at a given point
15. Original holder loses/deletes file
16. Transfer is corrupted (direct)
17. Server is down
18. Unable to conect to TCP node
19. Convert a failed direct to an indirect transfer
20. Server does not realise that a user has recieved the file (satus should last b/w app restarts)
21. Duplicate nicks selected - reject register request
22. Hard drive space less-remove pendings.
23. Requester recieves file while it is being replicated to other nodes as well
24. Tranfer is corrupted for a bounced file - delete the file at the replicated node
