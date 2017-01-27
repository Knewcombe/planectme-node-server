var express  = require('../node_modules/express');
var authApp = express.Router();
var userAccount = require( '../modules/app_modules_user.js'); // User modules
var userProfile = require( '../modules/app_modules_profile.js'); // User modules
var connection = require('../modules/app_modules_mysql.js');
var mysqlQuery = require('../constance/mysql_constance');
var tokenAuth = require('../modules/app_modules_token'); // used to create, sign, and verify tokens
var jwt = require('../node_modules/jsonwebtoken'); // used to create, sign, and verify tokens
var config = require('../config/config.js');
var passHash = require('../modules/app_modules_hash');

authApp.post('/authenticate', function(req, res) {
	//Will need to work on this, mabey a join stuff?
	//Check for the user.

	//CALLBACK function for token function. Will return the responce from function once the token has
	//Been created.
	var tokenCreated = function(responce){
		res.json(responce);
	}

	//Password has been verified
	var passSuccess = function(id){
		//As soon as the password has been match get the profile info and send it to the user.
		connection.query(
			'SELECT * FROM user_account WHERE user_id = '+id,
			function(err,rows){
				if(err) throw err;
				if(rows.length != 0){
					var user = new userAccount(rows[0]);
					connection.query(
						'SELECT * FROM user_profile WHERE profile_id = '+user.profile_id,
						function(err,rows){
							if(err) throw err;
							if(rows.length != 0){
								//Getting the last few infromatio peices for the user profile.
								var profile = new userProfile(rows[0]);
								tokenAuth.createToken(tokenCreated, user, profile);
							}
						}
					);
				}
			}
		);
	}
	//Password does not match
	var passErr = function(message){
		res.send(false);
	}
	console.log(req.body.email);
	connection.query(
		'SELECT * FROM user_account WHERE user_email = '+"'"+req.body.email + "'",
		function(err,rows){
			console.log(rows);
			if(err) throw err;
			if(rows.length != 0){
				passHash.verify(req.body.password, rows[0].password, rows[0].user_id, passSuccess, passErr);
			}else{
				res.send(false);
			}
		}
	);
});

authApp.post('/sign_up', function(req, res, next){
	// var user = new userProfile(req.body);
	// console.log(user);
	//Check if the user already exsists...
	connection.query(
		'SELECT user_email FROM user_account WHERE user_email = '+"'"+req.body.email+ "'",
		function(err,rows){
			if(err) throw err;
			//If the db returns something to the user, a user is already using the given email.
			if(rows.length != 0){
				res.send("false");
				res.end();
			}else{
				//Is the db returns nothing, the user does not exsist and the profile can be created.
				// req.user = user;
				next();
			}
		}
	);
}, function(req, res){
	console.log(req.body);
	var hashedSuccess = function(hashedPass){
		connection.query(
			'INSERT INTO user_profile (country, gender, allow_rating, visable_rating, hidden) VALUES (' + "'" + req.body.country + "', '" + req.body.gender + "', '" + req.body.options.rating + "', '" + req.body.options.visiableRate + "', '" + req.body.options.hidden +"')",
				function(err, rows){
					if(err) throw err;
					connection.query(
						'INSERT INTO user_account (profile_id, user_email, password, first_name, last_name, date_of_birth) VALUES (' + "'" +rows.insertId  + "', '" +  req.body.email + "', '" + hashedPass + "', '" + req.body.firstName
						+ "', '" + req.body.lastName + "', '" + req.body.dob + "')",
						function(err, rows){
							if(err) throw(err);
							res.send("User has logged in");
						}
					);
				}
		);
	}
	passHash.passwordHash(req.body.password, hashedSuccess);
});

authApp.post('/email_check', function(req, res, next){
	connection.query(
		'SELECT user_email FROM user_account WHERE user_email = '+"'"+req.body.email+ "'",
		function(err,rows){
			if(err) throw err;
			//If the db returns something to the user, a user is already using the given email.
			if(rows.length != 0){
				res.send(false);
			}else{
				res.send(true);
			}
		}
	);
});

authApp.post('/questions_add', function(req, res, next){
	console.log(req.body.user_id);
	console.log(req.body.questions);
		connection.query(
			'INSERT INTO user_questions (user_id, question, answer) VALUES (' + "'" + req.body.user_id + "', '" +req.body.questions.first.question+ "', '" +req.body.questions.first.answer+ "')",
			function(err,rows){
				if(err) throw err;
				//If the db returns something to the user, a user is already using the given email.
				if(rows.length != 0){
					if(err) throw(err);
					connection.query(
						'INSERT INTO user_questions (user_id, question, answer) VALUES (' + "'" + req.body.user_id + "', '" +req.body.questions.second.question+ "', '" +req.body.questions.second.answer+ "')",
						function(err,rows){
							if(err) throw err;
							//If the db returns something to the user, a user is already using the given email.
							if(rows.length != 0){
								if(err) throw(err);
								connection.query(
									'INSERT INTO user_questions (user_id, question, answer) VALUES (' + "'" + req.body.user_id + "', '" +req.body.questions.third.question+ "', '" +req.body.questions.third.answer+ "')",
									function(err,rows){
										if(err) throw err;
										//If the db returns something to the user, a user is already using the given email.
										if(rows.length != 0){
											if(err) throw(err);
											res.end();
										}
									}
								);
							}
						}
					);
				}
			}
		);
});

module.exports = authApp;
