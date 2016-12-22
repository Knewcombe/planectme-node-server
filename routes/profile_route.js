var express  = require('../node_modules/express');
var profileApp = express.Router();
var userProfile = require( '../modules/app_modules_profile.js'); // User modules
var connection = require('../modules/app_modules_mysql.js');
var mysqlQuery = require('../constance/mysql_constance');
var tokenAuth = require('../modules/app_modules_token'); // used to create, sign, and verify tokens
var jwt = require('../node_modules/jsonwebtoken'); // used to create, sign, and verify tokens
var config = require('../config/config.js');
var passHash = require('../modules/app_modules_hash');
var imageUpload = require('../modules/app_modules_images.js');


profileApp.post('/getProfiles', function(req, res){
	var exception = req.body;
	var query = 'SELECT * FROM user_profile WHERE profile_id NOT IN (';
	for(var i = 0; i < exception.length; i++){
		query += exception[i].profileId;
		if(i != (exception.length - 1)){
			query += ', ';
		}else{
			query +=  ') ORDER BY RAND() LIMIT 10';
		}
	}
	connection.query(
		query,
		function(err,rows){
			if(err) throw err;
			if(rows.length != 0){
				//Getting the last few infromatio peices for the user profile.
				res.json(rows);
			}else{
				res.end();
			}
		}
	);
});

profileApp.post('/upload', function(req, res){
	var insertPath = function(images){
		for (var i = 0, len = images.length; i < len; i++){
			connection.query(
				'INSERT INTO profile_pic (profile_id, image_location, default_picture) VALUES (' + "'" + req.query.profileId + "', '" + images[i].path + "', '0')",
				function(err,rows){
					if(err) throw err;
					if(rows.length != 0){
					}
				}
			);
		};
		res.json({error_code:0,err_desc:'done'});
	};
	imageUpload.saveImage(req, res, insertPath);
});

profileApp.post('/download', function(req, res){
	var imageArray = [];
	var imageSuccess = function(images){
		for (var i = 0, len = images.length; i < len; i++){
			imageArray.push({
				"image": new Buffer(images[i].file).toString('base64'),
				"pictureId": images[i].pictureId
			});
		};
		res.json(imageArray);
		res.end();
	}

	connection.query(
		'SELECT * FROM profile_pic WHERE profile_id = '+req.body.profileId,
		function(err,rows){
			if(err) throw err;
			if(rows.length != 0){
				//Getting the last few infromatio peices for the user profile.
				imageUpload.getImage(rows, imageSuccess);
			}else{
				res.end();
			}
		}
	);
})

profileApp.post('/update_images', function(req, res){
	var imageArray = [];
	var imageSuccess = function(images){
		for (var i = 0, len = images.length; i < len; i++){
			imageArray.push({
				"image": new Buffer(images[i].file).toString('base64'),
				"pictureId": images[i].pictureId
			});
		};
		res.json(imageArray);
		res.end();
	}

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
								res.end();
								}
							);
						}else{
							res.end();
						}
					}
				);
			};
		}

	var removeImageSuccess = function(){
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

profileApp.post('/favourite_profile', function(req, res){
	connection.query(
		'INSERT INTO favourite_profile (profile_id, fav_profile_id) VALUES ('+"'"+req.body.profileId+"', '"+req.body.favProfile+"')",
		function(err,rows){
			if(err) throw err;
				res.end();
			}
		);
});

profileApp.post('/favourite_find', function(req, res){
	connection.query(
		'SELECT * FROM favourite_profile WHERE profile_id = '+req.body.profileId+' AND fav_profile_id = '+req.body.favProfile,
		function(err,rows){
			if(err) throw err;
			if(rows.length != 0){
				res.send(true);
			}else{
				res.send(false);
			}
		}
	);
});

profileApp.post('/favourite_find_all', function(req, res){
	connection.query(
		'SELECT * FROM favourite_profile WHERE profile_id = '+req.body.profileId,
		function(err,rows){
			if(err) throw err;
			if(rows.length != 0){
				res.json(rows);
			}else{
				res.send(false);
			}
		}
	);
});

profileApp.post('/favourite_remove', function(req, res){
	connection.query(
		'DELETE FROM favourite_profile WHERE  profile_id ='+req.body.profileId+" AND fav_profile_id = "+req.body.favProfile,
		function(err,rows){
			if(err) throw err;
				res.end();
			}
		);
});

profileApp.post('/rate_profile', function(req, res){
	//See if the profile has already been rated by the current user.
	connection.query(
		'SELECT * FROM profile_rating WHERE profile_id = '+req.body.profileId + " AND rate_profile_id = "+ req.body.rateProfileId,
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
							res.end();
						}
					}
				);
			}else{
				//If there is no rows, inseart the rating.
				connection.query(
					'INSERT INTO profile_rating (profile_id, rate_profile_id, rate_amount) VALUES ('+"'"+req.body.profileId+"', '"+req.body.rateProfileId+"','"+req.body.value+"')",
					function(err,rows){
						if(err) throw err;
						res.end();
						}
					);
			}
		}
	);
});

profileApp.post('/profile_rating', function(req, res){
	connection.query(
		'SELECT * FROM profile_rating WHERE profile_id = '+req.body.profileId + " AND rate_profile_id = "+ req.body.rateProfileId,
		function(err,rows){
			if(err) throw err;
			if(rows.length != 0){
				res.json(rows);
			}else{
				res.send("0");
			}
		}
	);
});

profileApp.post('/profile_average', function(req, res){
	var sum = 0;
	connection.query(
		'SELECT * FROM profile_rating WHERE rate_profile_id = '+req.body.profileId,
		function(err,rows){
			if(err) throw err;
			if(rows.length != 0){
				for(var i = 0; rows.length > i; i++){
					sum += rows[i].rate_amount;
				}
				var arverage = sum/rows.length;
				res.send("'"+arverage+"'");
			}else{
				res.send("0");
			}
		}
	);
});

profileApp.post('/get_all_ratings', function(req, res){
	connection.query(
		'SELECT * FROM profile_rating WHERE rate_profile_id = '+req.body.profileId,
		function(err,rows){
			if(err) throw err;
			if(rows.length != 0){
				res.send(rows);
			}else{
				res.send(false);
			}
		}
	);
});

profileApp.post('/get_profile_data', function(req, res){
	connection.query(
		'SELECT * FROM user_profile WHERE profile_id = '+req.body.profileId,
		function(err,rows){
			if(err) throw err;
			console.log(rows.length);
			if(rows.length != 0){
				console.log(rows);
				res.send(rows);
			}else{
				res.send(false);
			}
		}
	);
})

profileApp.post('/get_favouite_amount', function(req, res){
	connection.query(
		'SELECT * FROM favourite_profile WHERE fav_profile_id = '+req.body.profileId,
		function(err,rows){
			if(err) throw err;
			if(rows.length != 0){
				res.json(rows.length);
			}else{
				res.send("0");
			}
		}
	);
})

module.exports = profileApp;
