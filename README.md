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
1. Authentication and architecture(Raghav)
2. Indexing and Sync (Naved)
3. Other Database Operations (Mayank)

Architecture Ideas
------------------
###Authentication
Major requirements: Anonymity for users, should ideally not be identifiable by IP. However with a packet-sniffing tool, this would be almost impossible to do, unless the server is involved in all transfers.
Nicknames wouldn't work as primary keys, because you should be able to change nicks as often as you like. Initial thoughts are using a hash of (one or more) MAC address, or maybe just a mac address.

###Server-initiated transfers
Possibly long-polling. Or we could have the client listen on a port.

