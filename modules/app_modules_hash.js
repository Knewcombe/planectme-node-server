var express  = require('../node_modules/express');
var passHash = express.Router();
var hashing = require('../node_modules/password-hash');

passHash.passwordHash = function(password, success){
	var hasingPass = hashing.generate(password);
	console.log(hasingPass);
	success(hasingPass);
}

passHash.verify = function(password, hashedPass, id, success, error){
	if(hashing.verify(password, hashedPass)){
		console.log("Did this even work??");
		//Return the id to find the user profile.
		console.log("Yes");
		success(id);
	}else{
		console.log("NO");
		error("Password dose not match");
	}

}

module.exports = passHash;
