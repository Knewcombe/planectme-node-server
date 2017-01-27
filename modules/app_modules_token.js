var express  = require('../node_modules/express');
var tokenAuth = express.Router();
var config = require('../config/config.js');
var jwt = require('../node_modules/jsonwebtoken-refresh'); // used to create, sign, and verify tokens

tokenAuth.createToken = function(success, user, profile){
	var token = jwt.sign(user, config.secret, {
		expiresIn: '24h'// expires in 1 week
	});
	// return the information including token as JSON
	var responce = {
		tokenInfo: {
			token: token,
			tokenRefresh: false
		},
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
