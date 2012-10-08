Bounced
=======

Server for the Bounce file-sharing network

Development Environment
-----------------------
1. Microsoft WebMatrix (http://www.microsoft.com/Web/webmatrix/node.aspx) (now works)
2. GitHub for Windows
3. Node.js (install 32-bit node, that's the only one that works with WebMatrix)
4. MongoDB (because it has Windows support as well) (set up: http://docs.mongodb.org/manual/tutorial/install-mongodb-on-windows/) (reading about mongo: http://docs.mongodb.org/manual/)
5. POSTman (to test the API) : https://chrome.google.com/webstore/detail/fdmmgilgnpjigdojojpjoooidkmcomcm

Packages for Node:
1. Express (tutorial: http://dailyjs.com/2010/11/08/node-tutorial-2/)
2. Mongoose (for MongoDB) (http://www.bloggedbychris.com/2012/06/20/windows-7-restful-web-service-node-js-express-mongodb/)

Tutorials:
1. Control flow: http://howtonode.org/control-flow
2. Passing parameters to callbacks: http://stackoverflow.com/questions/939032/jquery-pass-more-parameters-into-callback
3. Closures: http://web.archive.org/web/20080209105120/http://blog.morrisjohns.com/javascript_closures_for_dummies

Division of Labor
-----------------
1. Architecture (Raghav)
2. Database operations and caching (Naved)
3. Client (Mayank)

Architecture Ideas
------------------

###Keeping track of online users
This is tricky - we can explore keep-alive, and check if it is supported by the client. Otherwise, server may have to ping online clients round-robin to check state or vice versa.

###Authentication
Major requirements: Anonymity for users, should ideally not be identifiable by IP. However with a packet-sniffing tool, this would be almost impossible to do, unless the server is involved in all transfers.
Nicknames wouldn't work as primary keys, because you should be able to change nicks as often as you like. Initial thoughts are using a hash of (one or more) MAC address, or maybe just a mac address.

###Server-initiated transfers, peer-initiated transfers
Client will listen on a port.

###Network protocol
HTTP, as that is well-supported by Node and is easily debuggable in the browser and via Fiddler

###Data transfer
JSON, no questions asked

###Encryption over the wire
To prevent MITM and attempt to protect IP addresses of nicks from being revealed, HTTPS may be the way to go. We will have to see how to obtain a HTTPS certificate.

###Encryption on disk for friend-files
Could use the hash of the file as the encryption key, this would make life very easy as the requesting peer only needs to know the hash - which is anyway the primary key for a file. However, it remains to be seen how the client which has the file will know which file to send.

#### Scenario 1 - The file name is the hash.
Doesn't seem to be possible, as it would technically be possible for the user to download other files off the network and see if the hashes match. This may be time-consuming and irrationally expensive, as the client will not tell you the hash in the UI, you will have to packet-sniff (which is not possible if we use HTTPS) or read the applications local storage. Of course, the applications local storage can be encrypted to prevnt this from happening

###Encryption for standard transfers
Don't think this is worth the time and complexity, MITM can simply be prevented by using the comparing against the expected hash

###Local storage
SQLite or XML. Probably secured or encrypted in some way

###Distribution of network-specific configuration
#####Complex way
Run a common server that distributes list of IP addresses of server/failover server. Only makes sense if a concept of failover, load-sharing server exists. Then distribute the common-name of the server.
#####Easy way
Distribute a configuration file along with the installer, again, probably only makes sense if multiple servers exist
#####Ridiculously easy way
Hardcode the common server into the distributable

###Failover/Load sharing
Will be implemented later.

###Update mechanism
It is imperative that we find a way to update the client with minimum fuss. This is especially important as the client is likely to suffer from security issues, which may need to patched on a priority basis.
Again, an easy way to do this is to force the user to update to the latest version (simply by providing a link) and exiting the application if it is not on the latest version.

Requests and responses
----------------------

###GET /pending
**Request Body** mac:XYZ (new! - will significantly cut down on processing)  
**Response Body** [{'uploader':XYZ, 'type':'indirect'...},] (apart from everything in pending - this must return IP of uploader as well) 
**Client Action** Repeated every 'x' seconds  
**Server Action** Reset the timeout at which the server will mark the user offline  

###GET /search/the+big+bang+theory
**Request Body** None  
**Response Body** [{'uploader':XYZ, 'mac':'XYZ', 'type':'online', 'hash':XYZ, 'size':1234, ...},]  
**Client Action** When user searches for a file  
**Server Action** Return list of matching files

###GET /key/transferID
**Request Body** None  
**Response Body** {'key':XYZ} 
**Client Action** When a client recieves a request to serve a file
**Server Action** Return the key for a transferID

###GET /status
**Request Body** None  
**Response Body** {'transferId':XYZ, 'hash':XYZ, 'mac': XYZ, 'sent': 2, 'total': 5} 
**Client Action** When the pending tab is selected
**Server Action** Compute which transferIDs have what status

###POST /register
**Request Body** mac=XYZ, nick=XYZ, space_allocated=265348  
**Response Body** {'status': 'OK', 'text':'xyz'}  
**Client Action** Application start  
**Server Action** Mark user as online and start the timeout  

###POST /download
**Request Body** hash=XYZ, mac=XYZ, type=online  
**Response Body** {'status': 'OK', 'text':'xyz'}  
**Client Action** User click on 'download' or 'bounce' button  
**Server Action** Populate the pending queue appropriately  

###POST /sync
**Request Body** TBD  
**Response Body** {'status': 'OK', 'text':'xyz'}  
**Client Action** Client finishes calculating diffs  
**Server Action** Make appropriate changes to file table  

###POST /update
**Request Body** transfer_id=XYZ, type=cancel/done, [newhash=XYZ]
**Response Body** {'status': 'OK', 'text':'xyz'}  
**Client Action** Client cancels or completes download
**Server Action** Modify the pending queue appropriately  

Simple download protocol
------------------------

###Client initiates download
1. User selects a file and selects 'download'
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