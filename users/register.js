function registerUserHandler(req, res) {

    User.find({ 'mac': req.body.mac }, function (error, users) {

        if (users == undefined) {
            console.log('New user arrived');
            
            newuser = new User();
            newuser.mac = req.body.mac;
            newuser.dataDownloaded = 0;
            newuser.dataUploaded = 0;
            //TODO: Change when economics is added.
            users[0].spaceAllocated = 0;

            users = [];
            users.push(newuser);
        }

        if (users.length > 1) {
            console.log('Multiple users found for single mac');
            res.send({ 'status': 'Error', 'text': 'Duplicate MAC exists' });
        }

        users[0].online = true;
        users[0].ip = req.ip;
        users[0].nick = req.body.nick;
        
        users[0].save();
        console.log('Saving user ' + users[i]);

        res.send({ 'status': 'OK', 'text': 'Logged in successfully' });

    });
}

exports.registerUserHandler = registerUserHandler;