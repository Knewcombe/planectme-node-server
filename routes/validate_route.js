var express  = require('../node_modules/express');
var appValidate  = express.Router();                               // create our app w/ express
var config = require('../config/config.js'); // get our config file
var jwt = require('../node_modules/jsonwebtoken-refresh'); // used to create, sign, and verify tokens

appValidate.use(function(req, res, next){
	var token = req.body.token || req.query.token || req.headers['x-access-token'];
	var tokenRefresh = req.body.tokenRefresh || req.query.tokenRefresh || req.headers['x-access-tokenRefresh'];
	if (token) {
		// verifies secret and checks exp
		jwt.verify(token, config.secret, function(err, decoded) {
			if (err) {
				res.send({
				    success: false,
				    message: 'Token not valid.'
				});
			} else {
				if(tokenRefresh == true){
					console.log("Yes");
					var newToken = jwt.refresh(decoded, 3600, config.secret);
					req.newToken = newToken;
				}else{
					req.newToken = '';
				}
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
