//Change the value below to change the minimum supported client version for the current server.
version = "0.0.1";

function register(req, res) {
	res.send('Hello Register');
}

exports.version = version;
exports.register = register;