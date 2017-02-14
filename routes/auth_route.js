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
				res.send(false);
				res.end();
			}else{
				//Is the db returns nothing, the user does not exsist and the profile can be created.
				// req.user = user;
				next();
			}
		}
	);
}, function(req, res){
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
							res.send(true);
							res.end();
						}
					);
				}
		);
	}
	passHash.passwordHash(req.body.password, hashedSuccess);
});

authApp.post('/email_check', function(req, res, next){
	console.log(req.body.email);
	connection.query(
		'SELECT user_email FROM user_account WHERE user_email = '+"'"+req.body.email+"'",
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

authApp.post('/questions_get', function(req, res, next){
	console.log(req.body);
	connection.query(
		'SELECT user_id FROM user_account WHERE user_email = '+"'"+req.body.email+"'",
		function(err,rows){
			if(err) throw err;
			//If the db returns something to the user, a user is already using the given email.
			if(rows.length != 0){
				connection.query(
					'SELECT question_id, question FROM user_questions WHERE user_id = '+rows[0].user_id,
					function(err,questions){
						if(err) throw err;
						//If the db returns something to the user, a user is already using the given email.
						if(questions.length != 0){
							res.send(questions);
						}
					}
				);
			}else{
				res.send(false);
			}
		}
	);
});

authApp.post('/questions_add', function(req, res, next){
	console.log(req.body.user_id);
	console.log(req.body.questions);

	var firstQuestion = function(value){
			connection.query(
				'INSERT INTO user_questions (user_id, question, answer) VALUES (' + "'" + req.body.user_id + "', '" +req.body.questions.first.question+ "', '" +value+ "')",
				function(err,rows){
					if(err) throw err;
					//If the db returns something to the user, a user is already using the given email.
					if(rows.length != 0){
						if(err) throw(err);
						passHash.passwordHash(req.body.questions.second.answer, secondQestion);
					}
				}
			);
		}
		var secondQestion = function(value){
			connection.query(
				'INSERT INTO user_questions (user_id, question, answer) VALUES (' + "'" + req.body.user_id + "', '" +req.body.questions.second.question+ "', '" +value+ "')",
				function(err,rows){
					if(err) throw err;
					//If the db returns something to the user, a user is already using the given email.
					if(rows.length != 0){
						if(err) throw(err);
						passHash.passwordHash(req.body.questions.third.answer, thirdQuestion);
					}
				}
			);
		}

		//This is where this should end.
		var thirdQuestion = function(value){
			connection.query(
				'INSERT INTO user_questions (user_id, question, answer) VALUES (' + "'" + req.body.user_id + "', '" +req.body.questions.third.question+ "', '" +value+ "')",
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
		passHash.passwordHash(req.body.questions.first.answer, firstQuestion);
});

authApp.post('/answer_questions', function(req, res, next){
	console.log(req.body);

	var error = function(){
		console.log("Wrong answer");
		res.send(false);
	}

	var final = function(value){
		console.log("Thrid one right");
		res.send({user_id: value});
	}

	var secondSuccess = function(value){
		console.log("Second one right");
		connection.query(
			'SELECT answer, user_id FROM user_questions WHERE question_id = '+req.body.questions[2].id,
			function(err,rows){
				if(err) throw err;
				if(rows.length != 0){
					if(err) throw(err);
					console.log(req.body.questions[2].answer);
					console.log(rows[0].answer);
					passHash.verify(req.body.questions[2].answer, rows[0].answer, rows[0].user_id, final, error);
				}
			}
		);
	}

	var firstSuccess = function(value){
		console.log("First one right");
		connection.query(
			'SELECT answer, user_id FROM user_questions WHERE question_id = '+req.body.questions[1].id,
			function(err,rows){
				if(err) throw err;
				if(rows.length != 0){
					if(err) throw(err);
					console.log(req.body.questions[1].answer);
					console.log(rows[0].answer);
					passHash.verify(req.body.questions[1].answer, rows[0].answer, rows[0].user_id, secondSuccess, error);
				}
			}
		);
	}
	connection.query(
		'SELECT answer, user_id FROM user_questions WHERE question_id = '+req.body.questions[0].id,
		function(err,rows){
			if(err) throw err;
			if(rows.length != 0){
				if(err) throw(err);
				console.log(req.body.questions[0].answer);
				console.log(rows[0].answer);
				passHash.verify(req.body.questions[0].answer, rows[0].answer, rows[0].user_id, firstSuccess, error);
			}
		}
	);
});

authApp.post('/forgot_change_password', function(req, res, next){
	console.log(req.body.newPassword);
	var passwordChange = function(value){
		connection.query(
			'UPDATE user_account SET password = '+"'"+value+"'"+' WHERE user_id = '+"'"+req.body.user_id+ "'",
			function(err,rows){
				if(err) throw err;
				if(rows.length != 0){
					res.send(true);
				}else{
					res.send(false);
				}
			}
		);
	}
	passHash.passwordHash(req.body.newPassword, passwordChange);
});

module.exports = authApp;
