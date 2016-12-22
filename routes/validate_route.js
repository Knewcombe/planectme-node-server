var express  = require('../node_modules/express');
var appValidate  = express.Router();                               // create our app w/ express
var config = require('../config/config.js'); // get our config file
var jwt = require('../node_modules/jsonwebtoken'); // used to create, sign, and verify tokens

appValidate.use(function(req, res, next){
	var token = req.body.token || req.query.token || req.headers['x-access-token'];
	//console.log(token);
	if (token) {
		// verifies secret and checks exp
		jwt.verify(token, config.secret, function(err, decoded) {
			if (err) {
				res.send({
				    success: false,
				    message: 'Token not valid.'
				});
			} else {
				next();
			}
		});
	} else {
		// if there is no token
		// return an error
		res.status(403).send({
		    success: false,
		    message: 'No token provided.'
		});
	}
});

module.exports = appValidate;
