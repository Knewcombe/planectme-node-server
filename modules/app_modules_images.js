var express  = require('../node_modules/express');
var imageController = express.Router();
var fs = require('fs');
var path = require('path');
var multer = require('../node_modules/multer');

imageController.saveImage = function(req, res, callback){
	fs.stat('uploads/test'+req.query.profileId, function(err, stat){
		console.log("What the fuck");
		if(err){
			if(err.code == "EEXIST"){
				console.log("Exsist :"+ err.code);
				console.log("dir didnt need to be made");
				console.log("First upload called");
				//cb(null, 'uploads/test'+req.query.profileId);
			}else{
				fs.mkdir('uploads/test'+req.query.profileId, function(err) {
					console.log("Making dir");
					if(err) {
						console.log('Error in folder creation'+ err);
					}else{
						console.log("Second upload called");
					}
				});
			};
		}
		upload(req,res,function(err){
			console.log("Checking files");
				if(err){
					console.log(err);
					res.json({error_code:1,err_desc:err});
					return;
				}else{
					console.log(req.files);
					callback(req.files);
				}
			})
	});
	var storage = multer.diskStorage({ //multers disk storage settings
		destination: function (req, file, cb) {
			console.log("Is this called?");
			cb(null, 'uploads/test'+req.query.profileId);
		},
		filename: function (req, file, cb) {
			var datetimestamp = Date.now();
			console.log(datetimestamp);
			cb(null, file.fieldname + datetimestamp + '.' + file.originalname.split('.')[file.originalname.split('.').length -1]);
		}
	});

	var upload = multer({storage: storage}).array('file', 5);
};

imageController.getImage = function(imagePaths, imageSuccess){
	var images = [];
	for (var i = 0; i < imagePaths.length; i++){
		images.push({
			"file":fs.readFileSync(imagePaths[i].image_location),
			"pictureId": imagePaths[i].picture_id
		});
	}
	console.log(images);
	imageSuccess(images);
}

imageController.removeImage = function(imagePath, removeSuccess){
	for (var i = 0; i < imagePath.length; i++){
		fs.unlinkSync(imagePath[i].image_location);
	}
	removeSuccess(imagePath);
}

module.exports = imageController;
