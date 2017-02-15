var express  = require('../node_modules/express');
var passHash = express.Router();
var hashing = require('../node_modules/password-hash');

passHash.passwordHash = function(password, success){
	var hasingPass = hashing.generate(password);
	success(hasingPass);
}

passHash.verify = function(password, hashedPass, id, success, error){
	console.log(password);
	if(hashing.verify(password, hashedPass)){
		//Return the id to find the user profile.
		success(id);
	}else{
		error("Password dose not match");
	}

}

module.exports = passHash;
