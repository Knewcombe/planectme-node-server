//User rout for modules
var express  = require('../node_modules/express');
var userApp = express.Router();
var userAccount = require( '../modules/app_modules_user.js'); // User modules
var userProfile = require( '../modules/app_modules_profile.js'); // User modules
var connection = require('../modules/app_modules_mysql.js');
var mysqlQuery = require('../constance/mysql_constance');
var tokenAuth = require('../modules/app_modules_token'); // used to create, sign, and verify tokens
var jwt = require('../node_modules/jsonwebtoken'); // used to create, sign, and verify tokens
var config = require('../config/config.js');
var passHash = require('../modules/app_modules_hash');
var validation = require('../node_modules/validator');

//Headers need to be added with every request, I can control the access to these requests.
	userApp.post('/update_user', function(req, res) {

		var responce = {
			token: req.newToken,
			data: {}
		};

		var completeUpdate = function(){
			connection.query(
				'UPDATE user_account SET user_email = ' + "'" + validation.escape(validation.trim(req.body.email)) + "'" + ', first_name = '+ "'" +validation.escape(validation.trim(req.body.firstName))+ "'"
				+', last_name = '+ "'" +validation.escape(validation.trim(req.body.lastName))+ "'" +'  WHERE user_id = '+ req.body.userId + ';',
					function(err, rows){
						if(err) throw err;
						connection.query(
							'SELECT profile_id FROM user_account WHERE user_id ='+req.body.userId+';',
							function(err, rows){
								if(err) throw(err);
								connection.query(
									'UPDATE user_profile SET country = '+ "'" +validation.escape(req.body.country)+ "'" +', gender = '+ "'" +validation.escape(req.body.gender)+ "'" +', allow_rating = '+ "'" +req.body.options.rating+ "'" +
									', visable_rating = '+ "'" +req.body.options.visiableRate + "'" +', hidden = '+ "'" +req.body.options.hidden+ "'" +' WHERE profile_id = ' +req.body.profileId+';',
									function(err, rows){
										if(err) throw(err);
										connection.query(
											'SELECT * FROM user_account WHERE user_id = '+req.body.userId,
											function(err,rows){
												if(err) throw err;
												if(rows.length != 0){
													var newUser = new userAccount(rows[0]);
													connection.query(
														'SELECT * FROM user_profile WHERE profile_id = '+req.body.profileId,
														function(err,rows){
															if(err) throw err;
															if(rows.length != 0){
																//Getting the last few infromatio peices for the user profile.
																var newProfile = new userProfile(rows[0]);
																responce.data = {
																		userInfo: newUser,
																		profile: newProfile
																	};
																res.json(responce);
															}
														}
													);
												}
											}
										);
									}
								);
							}
						);
					}
				);
		}
		//Checking if email is beign used by another user.
		connection.query(
			'SELECT * FROM user_account WHERE user_email = '+"'"+validation.escape(validation.trim(req.body.email))+"'",
			function(err, rows){
				if(err) throw err;
				if(rows.length != 0){
					if(rows[0].profile_id == req.body.profileId){
						completeUpdate();
					}else{
							res.send("Email is already in use.");
					}
				}else{
					completeUpdate();
				}
			}
		);
	});

	userApp.post('/update_options', function(req, res){
		var responce = {
			token: req.newToken,
			data: {}
		};

		connection.query(
			'UPDATE user_profile SET allow_rating = '+ "'" +req.body.options.rating+ "'" + ', visable_rating = '+
			"'" +req.body.options.visiableRate + "'" +', hidden = '+ "'" +req.body.options.hidden+ "'" +' WHERE profile_id = ' +req.body.profileId+';',
			function(err, rows){
				if(err) throw(err);
				connection.query(
					'SELECT * FROM user_profile WHERE profile_id = '+req.body.profileId,
					function(err,rows){
						if(err) throw err;
						if(rows.length != 0){
							//Getting the last few infromatio peices for the user profile.
							var newProfile = new userProfile(rows[0]);
							responce.data = {
									profile: newProfile
								};
							res.json(responce);
						}
					}
				);
			}
		);
	});

	userApp.post('/change_password', function(req, res){

		responce = {
			token: req.newToken,
			data: false
		};

		var hashedSuccess = function(hashedPass){
			connection.query(
				'UPDATE user_account SET password = "'+hashedPass+'" WHERE user_id = '+ req.body.userId+ ';',
				function(err,rows){
			    if(err) throw err;
					if(rows.length != 0){
						responce.data = true;
						res.send(responce);
					}
				}
			);
		}
		var passSuccess = function(confId){
			id = confId;
			passHash.passwordHash(req.body.newPassword, hashedSuccess);
		}

		var passErr = function(auth){
			responce.data = {
					auth: auth
				}
			res.send(responce);
		}

			connection.query(
				'SELECT * FROM user_account WHERE user_id = '+"'"+req.body.userId+ "'",
				function(err,rows){
					if(err) throw err;
					if(rows.length != 0){
						passHash.verify(req.body.oldPassword, rows[0].password, rows[0].user_id, passSuccess, passErr);
					}
				}
			);
	});
	module.exports = userApp;
