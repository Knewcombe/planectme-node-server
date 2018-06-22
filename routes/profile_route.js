var express  = require('../node_modules/express');
var profileApp = express.Router();
var async = require('../node_modules/async');
var userProfile = require( '../modules/app_modules_profile.js'); // User modules
var connection = require('../modules/app_modules_mysql.js');
var mysqlQuery = require('../constance/mysql_constance');
var tokenAuth = require('../modules/app_modules_token'); // used to create, sign, and verify tokens
var jwt = require('../node_modules/jsonwebtoken'); // used to create, sign, and verify tokens
var config = require('../config/config.js');
var passHash = require('../modules/app_modules_hash');
var imageUpload = require('../modules/app_modules_images.js');
var validation = require('../node_modules/validator');

profileApp.post('/getProfiles', function(req, res){
	var profileids = req.body.profileId;
	var profiles = [];

	var responce = {
		token: req.newToken,
		data: {
			profile: {}
		}
	};
	var query = 'SELECT * FROM user_profile WHERE ';

	if(req.body.searchOptions.country != ''){
		console.log("Called country")
		query += 'country = '+"'"+validation.escape(req.body.searchOptions.country)+"'"+' AND ';
	}else{
		query += 'country IS NOT NULL AND ';
	}
	if(req.body.searchOptions.gender != ''){
		console.log("Called Gender")
		query += 'gender = '+"'"+validation.escape(req.body.searchOptions.gender)+"'"+' AND ';
	}else{
		query += 'gender IS NOT NULL AND ';
	}
	query += 'profile_id NOT IN (';
	for(var i = 0; i < profileids.length; i++){
		query += profileids[i];
		if(i != (profileids.length - 1)){
			query += ', ';
		}else{
			query +=  ') ORDER BY RAND()';
		}
	}
	connection.query(
		query,
		function(err,rows){
			if(err) throw err;
			if(rows.length != 0){
				var progress = (rows.length-1);
				async.forEachOf(rows, function(value, key){
					connection.query(
						'SELECT date_of_birth FROM user_account WHERE profile_id = '+value.profile_id,
						function(err,dateRows){
							if(err) throw err;
							if(dateRows.length != 0){
								var today = new Date();
							  var birthDate = new Date(dateRows[0].date_of_birth);
							  var age = today.getFullYear() - birthDate.getFullYear();
							  var m = today.getMonth() - birthDate.getMonth();
							  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())){
									age--;
								}
								if(age){
									if(age >= req.body.searchOptions.age.min && age <= req.body.searchOptions.age.max){
										if(req.body.requestCountry == value.country){
											if(value.hidden){
												profiles.push(value);
											}
										}else{
											profiles.push(value);
										}
									}
								}
								if(key == progress){
									console.log("Send 1");
									responce.data.profile = profiles;
									res.send(responce);
								}
							}else if(key == progress){
								console.log("Send 2");
								responce.data.profile = null;
								res.send(responce);
							}
						});
				}, function(err){
					if(err){
						console.log(err);
					}
				});
			}else{
				console.log("Send 3");
				responce.data.profile = null;
				res.send(responce)
			}
		}
	);
});

profileApp.post('/get_users_info', function(req, res, next){
	var responce = {
		token: req.newToken,
		data: {
			user: {},
			profile: {}
		}
	};

	connection.query(
		'SELECT * FROM user_account WHERE user_id ='+ req.body.userId,
		function(err, rows){
			if(err) throw err
			if(rows.length != 0){
				responce.data.user = rows[0];
				connection.query(
					'SELECT * FROM user_profile WHERE profile_id ='+ req.body.profileId,
					function(err, rows){
						if(err) throw err
						if(rows.length != 0){
							responce.data.profile = rows[0];
							res.send(responce);
						}
					}
				)
			}
		}
	)
})

profileApp.post('/upload', function(req, res){
	var responce = {
		token: req.newToken,
		data: {}
	};
	var insertPath = function(images){
		for (var i = 0, len = images.length; i < len; i++){
			connection.query(
				'INSERT INTO profile_pic (profile_id, image_location, default_picture) VALUES (' + "'" +req.query.profileId+ "', '" + images[i].path + "', '0')",
				function(err,rows){
					if(err) throw err;
					if(rows.length != 0){
					}
				}
			);
		};
		responce.data = {error_code:0,err_desc:'done'};
		res.send(responce);
	};
	imageUpload.saveImage(req, res, insertPath);
});

profileApp.post('/upload-base', function(req, res){
	console.log("Calling profile Upload");
	var responce = {
		token: req.newToken,
		data: {}
	};

	var error = function(){
		responce.data = false;
		res.send(responce);
	}

	var saveComplete = function(imagePath){
		console.log("Length of paths "+imagePath.length);
		for (var i = 0, len = imagePath.length; i < len; i++){
			connection.query(
				'INSERT INTO profile_pic (profile_id, image_location, default_picture) VALUES (' + "'" +req.body.profileId+ "', '" + imagePath[i] + "', '0')",
				function(err,rows){
					if(err) throw err;
					if(rows.length != 0){
						console.log("Insert Complete "+i);
					}
				}
			);
			if(i >= imagePath.length - 1){
				responce.data = true;
				res.send(responce);
			}
		};
	}

	imageUpload.saveBase64(req.body.images, req.body.profileId, saveComplete, error);
});

profileApp.post('/download', function(req, res){

	var responce = {
		token: req.newToken,
		data: {}
	};

	var imageArray = [];
	var imageSuccess = function(images){
		for (var i = 0, len = images.length; i < len; i++){
			imageArray.push({
				"image": new Buffer(images[i].file).toString('base64'),
				"pictureId": images[i].pictureId
			});
		};
		responce.data = imageArray
		res.send(responce);
	}

	connection.query(
		'SELECT * FROM profile_pic WHERE profile_id = '+req.body.profileId,
		function(err,rows){
			if(err) throw err;
			if(rows.length != 0){
				//Getting the last few infromatio peices for the user profile.
				imageUpload.getImage(rows, imageSuccess);
			}else{
				res.send(responce);
			}
		}
	);
})

profileApp.post('/update_images', function(req, res){
	var imageArray = [];
	var responce = {
		token: req.newToken
	};
	// var imageSuccess = function(images){
	// 	for (var i = 0, len = images.length; i < len; i++){
	// 		imageArray.push({
	// 			"image": new Buffer(images[i].file).toString('base64'),
	// 			"pictureId": images[i].pictureId
	// 		});
	// 	};
	// 	responce.push({
	// 		data: imageArray
	// 	})
	// 	res.send(responce);
	// }

	var insertPath = function(images){
		for (var i = 0; i < images.length; i++){
			var path = images[i].path;
			connection.query(
				'UPDATE profile_pic SET image_location = "'+path+'" WHERE picture_id = "'+ req.query.pictureId+'"',
				function(err,rows){
					if(err) throw err;
					if(rows.affectedRows == 0){
						connection.query(
							'INSERT INTO profile_pic (profile_id, image_location, default_picture) VALUES ('+"'"+req.query.profileId+"', '"+path+"', '0')",
							function(err,rows){
								if(err) throw err;
									res.send(responce);
								}
							);
						}else{
							res.send(responce);
						}
					}
				);
			};
		}

	var removeImageSuccess = function(){
		connection.query(
			'DELETE FROM profile_pic WHERE picture_id = "'+ req.query.pictureId+'"',
			function(err,rows){
				if(err) throw err;
				if(rows.affectedRows == 0){

					}else{
						res.send(responce);
					}
				}
			);
		imageUpload.saveImage(req, res, insertPath);
	}
	connection.query(
		'SELECT image_location FROM profile_pic WHERE picture_id = '+req.query.pictureId,
		function(err,rows){
			if(err) throw err;
			if(rows.length != 0){
				//Getting the last few infromatio peices for the user profile.
				imageUpload.removeImage(rows, removeImageSuccess);
			}else{
				imageUpload.saveImage(req, res, insertPath);
			}
		}
	);
});

profileApp.post('/update-base', function(req, res){

	var imageArray = [];
	var idArray = [];

	var responce = {
		token: req.newToken,
		data: false
	};

	var error = function(){
		res.send(responce);
	}

	var imageSuccess = function(images){
		for (var i = 0, len = images.length; i < len; i++){
			imageArray.push({
				"image": new Buffer(images[i].file).toString('base64'),
				"pictureId": images[i].pictureId
			});
		};
		responce.data = imageArray
		res.send(responce);
	}

	var insertPath = function(imagesPath){
		console.log("Update or insert");
		async.forEachOf(imagesPath, function(value, key){
			console.log("Trying update")
			connection.query(
				'UPDATE profile_pic SET image_location = "'+value+'" WHERE picture_id = "'+ idArray[key]+'"',
				function(err,rows){
					if(err) throw err;
					if(key == (imagesPath.length - 1)){
						res.send(responce);
					}
					if(rows.affectedRows == 0){
						console.log("Try Insert");
						connection.query(
							'INSERT INTO profile_pic (profile_id, image_location, default_picture) VALUES ('+"'"+req.body.profileId+"', '"+value+"', '0')",
							function(err,rows){
								if(err) throw err;
									console.log("Inseart Complete");
									responce.data = true;
								}
							);
						}else{
							console.log("Updated");
							responce.data = true;
						}
					}
				);
			});
		}
	for (var e = 0, len = req.body.images.length; e < len; e++){
		imageArray.push(req.body.images[e].image);
		idArray.push(req.body.images[e].pictureId);
		connection.query(
			'SELECT image_location FROM profile_pic WHERE picture_id = '+req.body.images[e].pictureId,
			function(err,rows){
				if(err) throw err;
				if(rows.length != 0){
					//Getting the last few infromatio peices for the user profile.
					console.log("Removing");
					imageUpload.removeImage(rows);
				}
			}
		);
		if(imageArray.length == req.body.images.length){
			console.log("Filled");
			imageUpload.saveBase64(imageArray, req.body.profileId, insertPath, error);
		}
	}
});

profileApp.post('/remove_image', function(req, res){
	var responce = {
		token: req.newToken,
		data: false
	};
	tempId = 0;
	async.forEachOf(req.body.images, function(value, key){
		connection.query(
			'SELECT image_location FROM profile_pic WHERE picture_id = '+value.pictureId,
			function(err,rows){
				if(err) throw err;
				if(rows.length != 0){
					console.log("Removing");
					imageUpload.removeImage(rows);
					connection.query(
						'DELETE FROM `planect_me_app`.`profile_pic` WHERE `profile_pic`.`picture_id` ='+value.pictureId,
						function(err, rows){
							if(err) throw err;
							console.log("Inseart Complete");
						}
					)
				}
			}
		);
		if(key == req.body.images.length - 1){
			console.log("Filled");
			responce.data = true;
			res.send(responce);
		}
	})

});

profileApp.post('/favourite_profile', function(req, res){
	var responce = {
		token: req.newToken
	};
	connection.query(
		'INSERT INTO favourite_profile (profile_id, fav_profile_id) VALUES ('+"'"+req.body.profileId+"', '"+req.body.favProfile+"')",
		function(err,rows){
			if(err) throw err;
				res.send(responce);
			}
		);
});

profileApp.post('/favourite_find', function(req, res){
	var responce = {
		token: req.newToken,
		data: false
	};
	connection.query(
		'SELECT * FROM favourite_profile WHERE profile_id = '+req.body.profileId+' AND fav_profile_id = '+req.body.favProfile,
		function(err,rows){
			if(err) throw err;
			if(rows.length != 0){
				responce.data = true
			}else{
				responce.data = false
			}
			res.send(responce);
		}
	);
});

profileApp.post('/favourite_find_all', function(req, res){
	var responce = {
		token: req.newToken,
		data: false
	};
	connection.query(
		'SELECT * FROM favourite_profile WHERE profile_id = '+req.body.profileId,
		function(err,rows){
			if(err) throw err;
			if(rows.length != 0){
				responce.data = rows;
			}else{
				responce.data = false;
			}
			res.send(responce);
		}
	);
});

profileApp.post('/favourite_remove', function(req, res){
	var responce = {
		token: req.newToken
	};
	connection.query(
		'DELETE FROM favourite_profile WHERE  profile_id ='+req.body.profileId+" AND fav_profile_id = "+req.body.favProfile,
		function(err,rows){
			if(err) throw err;
				res.send(responce);
			}
		);
});

profileApp.post('/rate_profile', function(req, res){
	//See if the profile has already been rated by the current user.
	var responce = {
		token: req.newToken
	};
	connection.query(
		'SELECT * FROM profile_rating WHERE profile_id = '+req.body.profileId + " AND rate_profile_id = "+req.body.rateProfileId,
		function(err,rows){
			if(err) throw err;
			if(rows.length != 0){
				//If there is any amount of rows, they need to be updated.
				connection.query(
					'UPDATE profile_rating SET rate_amount = "'+req.body.value+'" WHERE profile_id = '+req.body.profileId + " AND rate_profile_id = "+ req.body.rateProfileId,
					function(err,rows){
						if(err) throw err;
						if(rows.length != 0){
							//If there is any amount of rows, they need to be updated.
							res.send(responce);
						}
					}
				);
			}else{
				//If there is no rows, inseart the rating.
				connection.query(
					'INSERT INTO profile_rating (profile_id, rate_profile_id, rate_amount) VALUES ('+"'"+req.body.profileId+"', '"+req.body.rateProfileId+"','"+req.body.value+"')",
					function(err,rows){
						if(err) throw err;
						res.send(responce);
						}
					);
			}
		}
	);
});

profileApp.post('/profile_rating', function(req, res){
	var responce = {
		token: req.newToken,
		data: {}
	};
	connection.query(
		'SELECT * FROM profile_rating WHERE profile_id = '+req.body.profileId + " AND rate_profile_id = "+ req.body.rateProfileId,
		function(err,rows){
			if(err) throw err;
			if(rows.length != 0){
				responce.data = rows
			}else{
				responce.data = '0'
			}
			res.send(responce);
		}
	);
});

profileApp.post('/profile_average', function(req, res){
	var responce = {
		token: req.newToken,
		data: {}
	};
	var sum = 0;
	connection.query(
		'SELECT * FROM profile_rating WHERE rate_profile_id = '+req.body.profileId,
		function(err,rows){
			if(err) throw err;
			if(rows.length != 0){
				for(var i = 0; rows.length > i; i++){
					sum += rows[i].rate_amount;
				}
				var average = sum/rows.length;
				responce.data = average;
			}else{
				responce.data = '0';
			}
			res.send(responce);
		}
	);
});

profileApp.post('/get_all_ratings', function(req, res){
	var responce = {
		token: req.newToken,
		data: {}
	};
	connection.query(
		'SELECT * FROM profile_rating WHERE rate_profile_id = '+req.body.profileId,
		function(err,rows){
			if(err) throw err;
			if(rows.length != 0){
				responce.data = rows
			}else{
				responce.data = false
			}
			res.send(responce)
		}
	);
});

profileApp.post('/get_profile_data', function(req, res){
	var responce = {
		token: req.newToken,
		data: {}
	};
	connection.query(
		'SELECT * FROM user_profile WHERE profile_id = '+req.body.profileId,
		function(err,rows){
			if(err) throw err;
			if(rows.length != 0){
				if(rows[0].country === req.body.requestCountry){
					if(rows[0].hidden){
						responce.data = rows;
					}else{
						responce.data = false;
					}
				}else{
					responce.data = rows;
				}
			}else{
				responce.data = false;
			}
			res.send(responce)
		}
	);
})

profileApp.post('/get_favouite_amount', function(req, res){
	var responce = {
		token: req.newToken,
		data: {}
	};
	connection.query(
		'SELECT * FROM favourite_profile WHERE fav_profile_id = '+req.body.profileId,
		function(err,rows){
			if(err) throw err;
			if(rows.length != 0){
				responce.data = rows.length;
			}else{
				responce.data = '0';
			}
			res.send(responce)
		}
	);
})

module.exports = profileApp;
