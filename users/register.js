var userTimeout = require('./timeout').userTimeout;

function registerUserHandler(req, res) {

    User.find({ 'mac': req.body.mac }, function (error, users) {

        if (error) {
            res.send({ 'status': 'Error', 'text': error });
            return;
        }

        if (users.length==0) {
            console.log('New user arrived');
            
            var newuser = new User();
            newuser.mac = req.body.mac;
            newuser.dataDownloaded = 0;
            newuser.dataUploaded = 0;
            //TODO: Change when economics is added.
            newuser.spaceAllocated = 0;

            users = [];
            users.push(newuser);
        }

        if (users.length > 1) {
            console.log('Multiple users found for single mac');
            res.send({ 'status': 'Error', 'text': 'Duplicate MAC exists' });
            return;
        }

        users[0].online = true;
        users[0].ip = req.ip;
        users[0].nick = req.body.nick;
        
        var currentUser= users[0];
        currentUser.save();
        console.log('Saved user ' + currentUser);

        // Updating friend relationships asynchronously
        updateAllFriendships(currentUser);

        //TODO: Think about what the timeout should be (this code also in 'pending')
        onlineUsers[currentUser.mac] = setTimeout(userTimeout(currentUser.mac, onlineUsers), 1 * 60 * 1000);

        res.send({ 'status': 'OK', 'text': 'Logged in successfully' });

    });
}

// Runs a loop through all online friends, calling updateFriendship on each
function updateAllFriendships(currentUser) {
    User.find({ 'online': true }, function (error, onlineUsers) {

        for (i = 0; i < onlineUsers.length; i++) {

            if (onlineUsers[i].mac === currentUser.mac)
                continue;

            updateFriendship(currentUser, onlineUsers[i]);
        }
    });
}

// Finds the friendship and increments count or creates a new friendship
function updateFriendship(currentUser, currentOnlineUser) {

    var queryParams = {
        $or: [{ 'friend1': currentOnlineUser.mac, 'friend2': currentUser.mac },
            { 'friend1': currentUser.mac, 'friend2': currentOnlineUser.mac }]
    };

    Friendship.find(queryParams, function (error, friends) {

        currentOnlineUserMac = currentOnlineUser.mac;

        // Create if relationship is not already present
        if (friends.length == 0) {
            //console.log("Creating new friendship between " + currentUser.mac + "and " + currentOnlineUserMac);
            var newFriendship = new Friendship();
            newFriendship.friend1 = currentUser.mac;
            newFriendship.friend2 = currentOnlineUserMac;
            newFriendship.count = 1;
            newFriendship.save();
        }
        // Increment count if relationship is already present
        else {
            //console.log("Friendships found:" + friends.length);
            friends[0].count = friends[0].count + 1;
            friends[0].save();
        }
    });
}

exports.registerUserHandler = registerUserHandler;