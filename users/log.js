var winston = require('winston');

/*var logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)({ json: false, timestamp: true }),
    new winston.transports.File({ filename: "C:/Users/hp/Documents/GitHub/bounced/users" + '/debug.log', json: false })
  ],
  exceptionHandlers: [
    new (winston.transports.Console)({ json: false, timestamp: true }),
    new winston.transports.File({ filename: "C:/Users/hp/Documents/GitHub/bounced/users"+	 '/exceptions.log', json: false })
  ],
  exitOnError: false
});
*/
winston.add(winston.transports.File, { filename: 'somefile.log' });
winston.remove(winston.transports.Console);
//exports.registerUserHandler = registerUserHandler;

exports.winston = winston;