var express  = require('../node_modules/express');
var tokenAuth = express.Router();
var config = require('../config/config.js');
var jwt = require('../node_modules/jsonwebtoken'); // used to create, sign, and verify tokens

tokenAuth.createToken = function(success, user, profile){
	var token = jwt.sign(user, config.secret, {
		expiresIn: 60*24// expires in 24 hours
	});
	// return the information including token as JSON
	var responce = {
		token: token,
		userInfo: user,
		profile: profile
	};
	success(responce);
}

tokenAuth.checkToken = function(success, error, token){
	jwt.verify(token, config.secret, function(err, decoded) {
		if (err) {
			var tokenAuth = {
				success: false,
				message: 'Token has expired'
			};
			error(tokenAuth);
		} else {
			// if everything is good, save to request for use in other routes
			tokenAuth = {
				success: true,
				message: 'Token is good'
			};
			success(tokenAuth);
			//next();
		}
	});
}

module.exports = tokenAuth;
