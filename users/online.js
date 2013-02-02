

var clearInactiveUsers = function () {
    var current = new Date().getTime() / 1000;

    console.log("Online users:");
    console.log(userLastPingTimes);

    for (user in userLastPingTimes) {

        // If user has not pinged us for n seconds, remove from online list
        if ((current - userLastPingTimes[user]) > 6) {
            delete userLastPingTimes[user];

            // Make status offline in database as well
            User.findOne({ 'mac': user }, function (error, userDel) {
                if (error)
                    console.log("userTimeout: " + error);

                if (user == null)
                    return;

                userDel.online = false;
                userDel.save();
            });
        }
    }
}

var updateLastPingTime = function (user) {
    if (userLastPingTimes[user] == null) {
        return false;
    }
    else {
        userLastPingTimes[user] = new Date().getTime() / 1000;
        return true;
    }
}

var addToOnlineList = function (user) {
    userLastPingTimes[user] = new Date().getTime() / 1000;
}


exports.clearInactiveUsers = clearInactiveUsers;
exports.updateLastPingTime = updateLastPingTime;
exports.addToOnlineList = addToOnlineList;
