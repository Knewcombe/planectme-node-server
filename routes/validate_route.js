var express  = require('../node_modules/express');
var appValidate  = express.Router();                               // create our app w/ express
var config = require('../config/config.js'); // get our config file
var jwt = require('../node_modules/jsonwebtoken'); // used to create, sign, and verify tokens

appValidate.use(function(req, res, next){
	console.log("Test validate");
	console.log(req.body);
	var token = req.body.token || req.query.token || req.headers['x-access-token'];
	//console.log(token);
	if (token) {
		console.log("Token found")
		// verifies secret and checks exp
		jwt.verify(token, config.secret, function(err, decoded) {
			if (err) {
				console.log("Token not valide");
				res.send({
				    success: false,
				    message: 'Token not valid.'
				});
			} else {
				// if everything is good, save to request for use in other routes
				// res.send({
				// 	 success: true,
				// 	 message: 'Token.'
				// });
				console.log("Token valid");
				next();
			}
		});
	} else {
		console.log("No Token");
		// if there is no token
		// return an error
		res.status(403).send({
		    success: false,
		    message: 'No token provided.'
		});
	}
});

module.exports = appValidate;
