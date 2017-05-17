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
var validation = require('../node_modules/validator');
var iap = require('../node_modules/in-app-purchase');

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
	connection.query(
		'SELECT * FROM user_account WHERE user_email = '+"'"+validation.escape(validation.trim(req.body.email)) + "'",
		function(err,rows){
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
		'SELECT user_email FROM user_account WHERE user_email = '+"'"+validation.escape(validation.trim(req.body.email))+ "'",
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
	var gotUID = false;
	var tempId = 0;
	do{
		console.log('test')
		tempId = Math.floor(100000000 + Math.random() * 900000000);
		connection.query(
			'SELECT profile_id FROM user_profile WHERE profile_id ='+ tempId,
				function(err, rows){
					if(err) throw err;
					if(!rows.length){
						gotUID = true;
					}
				}
		);
	}
	while(gotUID);
	var hashedSuccess = function(hashedPass){
		connection.query(
			'INSERT INTO user_profile (profile_id, country, gender, allow_rating, visable_rating, hidden) VALUES ('+tempId+ ", '" + validation.escape(req.body.country) + "', '" + validation.escape(req.body.gender) + "', '" + req.body.options.rating +
			"', '" + req.body.options.visiableRate + "', '" + req.body.options.hidden +"')",
				function(err, rows){
					if(err) throw err;
					connection.query(
						'INSERT INTO user_account (profile_id, user_email, password, first_name, last_name, date_of_birth) VALUES (' + "'" +rows.insertId  + "', '" +  validation.escape(validation.trim(req.body.email)) + "', '" + hashedPass + "', '" + validation.escape(validation.trim(req.body.firstName))
						+ "', '" + validation.escape(validation.trim(req.body.lastName)) + "', '" + validation.escape(req.body.dob) + "')",
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
	connection.query(
		'SELECT user_email FROM user_account WHERE user_email = '+"'"+validation.escape(validation.trim(req.body.email))+"'",
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
	connection.query(
		'SELECT user_id FROM user_account WHERE user_email = '+"'"+validation.escape(validation.trim(req.body.email))+"'",
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

	var firstQuestion = function(value){
			connection.query(
				'INSERT INTO user_questions (user_id, question, answer) VALUES (' + "'" + req.body.user_id + "', '" +validation.escape(req.body.questions.first.question)+ "', '" +value+ "')",
				function(err,rows){
					if(err) throw err;
					//If the db returns something to the user, a user is already using the given email.
					if(rows.length != 0){
						if(err) throw(err);
						passHash.passwordHash(validation.trim(req.body.questions.second.answer.toLowerCase()), secondQestion);
					}
				}
			);
		}
		var secondQestion = function(value){
			connection.query(
				'INSERT INTO user_questions (user_id, question, answer) VALUES (' + "'" + req.body.user_id+ "', '" +validation.escape(req.body.questions.second.question)+ "', '" +value+ "')",
				function(err,rows){
					if(err) throw err;
					//If the db returns something to the user, a user is already using the given email.
					if(rows.length != 0){
						if(err) throw(err);
						passHash.passwordHash(validation.trim(req.body.questions.third.answer.toLowerCase()), thirdQuestion);
					}
				}
			);
		}

		//This is where this should end.
		var thirdQuestion = function(value){
			connection.query(
				'INSERT INTO user_questions (user_id, question, answer) VALUES (' + "'" + req.body.user_id + "', '" +validation.escape(req.body.questions.third.question)+ "', '" +value+ "')",
				function(err,rows){
					if(err) throw err;
					//If the db returns something to the user, a user is already using the given email.
					if(rows.length != 0){
						if(err) throw(err);
						res.send(true)
						res.end();
					}
				}
			);
		}
		passHash.passwordHash(validation.trim(req.body.questions.first.answer.toLowerCase()), firstQuestion);
});

authApp.post('/answer_questions', function(req, res, next){

	var error = function(){
		res.send(false);
	}

	var final = function(value){
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
					passHash.verify(validation.escape(validation.trim(req.body.questions[2].answer.toLowerCase())), rows[0].answer.toLowerCase(), rows[0].user_id, final, error);
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
					passHash.verify(validation.escape(validation.trim(req.body.questions[1].answer.toLowerCase())), rows[0].answer.toLowerCase(), rows[0].user_id, secondSuccess, error);
				}
			}
		);
	}
	connection.query(
		'SELECT answer, user_id FROM user_questions WHERE question_id = '+req.body.questions[0].id,
		function(err,rows){
			if(err) throw err;
			if(rows.length != 0){
				passHash.verify(validation.escape(validation.trim(req.body.questions[0].answer.toLowerCase())), rows[0].answer.toLowerCase(), rows[0].user_id, firstSuccess, error);
			}
		}
	);
});

authApp.post('/forgot_change_password', function(req, res, next){
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

authApp.post('/validate_purchase', function(req, res, next){
	console.log('Validating purchase');
	console.log(req.body);
	// var profileId = req.body.profileId;
	// var transactionId = req.body.transactionId;
	// var receipt = req.body.receipt;
	iap.config({
		applePassword: config.appleSec
	});
	iap.setup(function (error) {
    if (error) {
				console.log(error)
				console.error('something went wrong...');
				res.end(false);
    }
    // iap is ready
    iap.validate(iap.APPLE, req.body.receipt, function (err, appleRes) {
        if (err) {
						console.error(err);
						res.end(false);
        }
        if (iap.isValidated(appleRes)) {
            // yay good!
						// var purchaseDataList = iap.getPurchaseData(appleRes);
						console.log('------Res------')
						console.log(appleRes.latest_receipt)
						console.log(appleRes.latest_receipt_info[0].transaction_id)
						connection.query(
							'INSERT INTO profile_purchases (profile_id, transaction_id, receipt) VALUES('+req.body.profileId+','+req.body.transactionId+',"'+req.body.receipt+'")',
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
    });
	});
});

authApp.post('/check_purchase', function(req, res, next){
	console.log('Check purchase');
	//Need to get the purchase from data base
	console.log(req.body)
	connection.query(
		'SELECT receipt, transaction_id FROM profile_purchases WHERE profile_id = '+req.body.profileId,
		function(err,rows){
			if(err) throw err;
			if(rows.length != 0){
				iap.config({
					applePassword: config.appleSec
				});
				iap.setup(function (error) {
			    if (error) {
							console.log(error)
							console.error('something went wrong...');
							res.send("false");
			    }
			    // iap is ready
			    iap.validate(iap.APPLE, rows[0].receipt, function (err, appleRes) {
			        if (err) {
									console.error(err);
									res.send("false");
			        }
			        if (iap.isValidated(appleRes)) {
			            // yay good!
									// var purchaseDataList = iap.getPurchaseData(appleRes);
									var purchaseDataList = iap.getPurchaseData(appleRes);
									var responce = '';
									console.log('Checking the purchases')
									// console.log(purchaseDataList);
			            for (var i = 0, len = purchaseDataList.length; i < len; i++) {
										console.log(purchaseDataList[i].transactionId);
										if(rows[0].transaction_id == purchaseDataList[i].transactionId){
											// console.log(rows[0].transaction_id);
											// console.log(purchaseDataList[i].transactionId);
											if (iap.isExpired(purchaseDataList[i])) {
													// this item has been expired...
													console.log('Expired');
													connection.query(
														'DELETE FROM profile_purchases WHERE profile_id = '+req.body.profileId,
														function(err,rows){
															if(err) throw err;
															// res.write("false");
														}
													);
													responce = 'false'
											}else{
												console.log('Good to go ')
												responce = 'true'
											}
										}
										if(i+1 == purchaseDataList.length){
											console.log(responce);
											console.log('console call')
											res.write(responce);
											res.end();
										}
			            }
			        }
			    });
				});
			}else{
				res.send("false");
			}
		}
	);
})

module.exports = authApp;
