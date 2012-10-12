
function userTimeout(mac, onlineUsers) {

    return function () {

        console.log("userTimeout onlineUsers:");
        console.log(onlineUsers);

        User.findOne({ 'mac': mac }, function (error, user) {
            if (error)
                console.log("userTimeout: " + error);

            if (user == null)
                return;

            user.online = false;
            user.save();
        });

        console.log("User " + mac + " is now offline");

        delete (onlineUsers[mac]);
    }
}

exports.userTimeout = userTimeout;
exports.onlineUsers = onlineUsers;