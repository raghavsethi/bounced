Bounced
=======

Server for the Bounce file-sharing network

Development Environment
-----------------------
1. Notepad++ / VS2012
2. GitHub for Windows
3. Node.js

Division of Labor
-----------------
1. Authentication and architecture (Raghav)
2. Indexing and sync (Naved)
3. Other database operations, encryption (Mayank)

Architecture Ideas
------------------
###Authentication
Major requirements: Anonymity for users, should ideally not be identifiable by IP. However with a packet-sniffing tool, this would be almost impossible to do, unless the server is involved in all transfers.
Nicknames wouldn't work as primary keys, because you should be able to change nicks as often as you like. Initial thoughts are using a hash of (one or more) MAC address, or maybe just a mac address.

###Server-initiated transfers, peer-initiated transfers
Possibly long-polling the server. Or we could have the client listen on a port. Listening on a port is probably a better option, because that will reduce latency and server-load for peer-initiated transfers

###Network protocol
Definitely TCP, and leaning towards HTTP, as that is well-supported by Node and is easily debuggable in the browser and via Fiddler

###Data transfer
JSON, no questions asked

###Encryption over the wire
To prevent MITM and attempt to protect IP addresses of nicks from being revealed, HTTPS may be the way to go. We will have to see how to obtain a HTTPS certificate

###Encryption on disk for friend-files
Could use the hash of the file as the encryption key, this would make life very easy as the requesting peer only needs to know the hash - which is anyway the primary key for a file. However, it remains to be seen how the client which has the file will know which file to send.

#### Scenario 1 - The file name is the hash.
Doesn't seem to be possible, as it would technically be possible for the user to download other files off the network and see if the hashes match. This may be time-consuming and irrationally expensive, as the client will not tell you the hash in the UI, you will have to packet-sniff (which is not possible if we use HTTPS) or read the applications local storage. Of course, the applications local storage can be encrypted to prevnt this from happening

###Encryption for standard transfers
Don't think this is worth the time and complexity

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
Possibly can be left for later

###Update mechanism
It is imperative that we find a way to update the client with minimum fuss. This is especially important as the client is likely to suffer from security issues, which may need to patched on a priority basis.
Again, an easy way to do this is to force the user to update to the latest version (simply by providing a link) and exiting the application if it is not on the latest version.