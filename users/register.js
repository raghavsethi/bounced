﻿var addToOnlineList = require('./online').addToOnlineList;
var winston = require('winston');
var MongoDB = require('winston-mongodb')//.MongoDB;


var logger = new (winston.Logger)({
    transports: [
      new (winston.transports.Console)(),
      new (winston.transports.File)({ filename: 'requests.log', json:false })
    ]
});

var researchLogger = new (winston.Logger)({
    transports: [
      new (winston.transports.Console)()
    ]
});
researchLogger.add(winston.transports.MongoDB, { db: 'log', collection: 'log'});


function registerUserHandler(req, res) {

    var clientVersion = req.body.version;

    User.find({ 'nick': req.body.nick }, function (error, users) {

        if (error) {
            logger.error('register.js-registerUserHandler: Unable to register. Reason - Mongo error. IP' + req.ip);
            res.send({ 'status': 'Error', 'text': error });
            return;
        }

        if (req.body.nick.length === 0) {
            logger.error('register.js-registerUserHandler: Unable to register. Reason - Invalid Username. IP' + req.ip);
            res.send({ 'status': 'Error', 'text': "Invalid username" });
            return;
        }

        if (users.length > 0) {

            if (users.length == 1 && users[0].mac === req.body.mac)
            { }
            else {
                logger.error('register.js-registerUserHandler: Unable to register. Reason - Username ' + req.body.nick + '  already exists. IP' + req.ip);
                res.send({ 'status': 'Error', 'text': 'This username is already registered' });
                return;
            }
        }

        User.find({ 'mac': req.body.mac }, function (error, users) {

            if (error) {
                logger.error('register.js-registerUserHandler: Unable to register. Reason - Mongo error. IP' + req.ip);
                res.send({ 'status': 'Error', 'text': error });
                return;
            }

            if (users.length == 0) {

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
                logger.error('register.js-registerUserHandler: Unable to register. Reason - Duplicate MAC. IP' + req.ip);
                res.send({ 'status': 'Error', 'text': 'Duplicate MAC exists' });
                return;
            }

            users[0].online = true;
            users[0].ip = req.ip;
            users[0].nick = req.body.nick;

            var currentUser = users[0];
            currentUser.save();
            //logger.info('register   Saved user ' + currentUser.nick);

            addToOnlineList(users[0].mac);
            var registerLog = {}
            registerLog["type"] = "online";
            registerLog["onlineMAC"] = users[0].mac;
            researchLogger.info(registerLog);

            // Updating friend relationships asynchronously
            updateAllFriendships(currentUser);

            logger.info('register.js-registerUserHandler: User Registered with IP ' + req.ip + ', MAC ' + currentUser.mac + ' and nick ' + currentUser.nick);

            User.find({'ip':req.ip,'mac':{$ne:req.body.mac}}, function (error, duplicateIP){
                if (!error){
                    for (var i = 0; i <duplicateIP.length; i++) {
                        duplicateIP[i].ip='0';
                        logger.info('register.js-registerUserHandler: duplicateIP ' + req.ip + '. User with MAC ' + duplicateIP[i].mac + ' has IP set to 0');
                        duplicateIP[i].save();
                    };
                }

            });

            res.send({ 'status': 'OK', 'text': 'Logged in successfully' });
        });
    })

    
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