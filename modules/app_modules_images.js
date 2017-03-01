var express  = require('../node_modules/express');
var imageController = express.Router();
var fs = require('fs');
var path = require('path');
var multer = require('../node_modules/multer');
var Jimp = require("../node_modules/jimp");
var async = require('../node_modules/async');

imageController.saveImage = function(req, res, callback){
	fs.stat('uploads/test'+req.query.profileId, function(err, stat){
		if(err){
			if(err.code == "EEXIST"){
				//cb(null, 'uploads/test'+req.query.profileId);
			}else{
				fs.mkdir('uploads/test'+req.query.profileId, function(err) {
					if(err) {
						console.log('Error in folder creation'+ err);
					}else{
						console.log("Second upload called");
					}
				});
			};
		}
		upload(req,res,function(err){
				if(err){
					res.json({error_code:1,err_desc:err});
					return;
				}else{
					callback(req.files);
				}
			})
	});
	var storage = multer.diskStorage({ //multers disk storage settings
		destination: function (req, file, cb) {
			cb(null, 'uploads/test'+req.query.profileId);
		},
		filename: function (req, file, cb) {
			var datetimestamp = Date.now();
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
	imageSuccess(images);
}

imageController.removeImage = function(imagePath){
	for (var i = 0; i < imagePath.length; i++){
		fs.unlinkSync(imagePath[i].image_location);
	}
}

imageController.saveBase64 = function(images, profileId, imageSaved, error){
	console.log("Calling profile Upload");
	var imagePaths = [];
	var dirCheck = function(path){
		console.log('=======DirCheck======');
		// console.log("Before Loop"+ i);
		//dir is either created or alreadt exsists
		async.forEachOf(images, function(value, key){
			var imageData = {
			  "mimeType" : '',
			  "src" : '',
				"extention" : ''
			}
			imageData.mimeType = value.split(';')[0];
			imageData.src = value.split(',')[1];
			if(imageData.mimeType == 'data:image/png'){
				console.log('png');
				imageData.extention = '.png';
			}else if(imageData.mimeType == 'data:image/jpeg'){
				console.log('jpg');
				imageData.extention = '.jpg';
			}
			// var base64Data = value.replace('data:image/jpeg;base64,', "");
			// var datetimestamp = new Date();
			var fileName = Date.now() + profileId +"-"+ key + imageData.extention;
			imagePaths.push(path+fileName);
			fs.writeFile(path+fileName, imageData.src, 'base64', function(err) {
				if(err){
					error();
				}else{
					Jimp.read(path+fileName).then(function (test) {
						if(test.bitmap.width >= 2448){
							console.log(test.bitmap.width); // the width of the image
							test.resize((test.bitmap.width/2), Jimp.AUTO)            // resize
						 .quality(50)                 // set JPEG quality
						 .write(path+fileName); // save
						}
					}).catch(function (err) {
							console.error(err);
					});
				}

				console.log("File write complete for file");
			});
			if(key >= (images.length - 1)){
				console.log("When is this called")
				imageSaved(imagePaths);
			}
		});
	}
	//Check if the folder exsists
	fs.stat('uploads/user'+profileId, function(err, stat){
		console.log("Checking got Dir");
		if(err){
			//Checking for error
			if(err.code == "EEXIST"){
				console.log(err.code);
				dirCheck('uploads/user'+profileId+'/');
			}else{
				//Create the folder
				fs.mkdir('uploads/user'+profileId, function(err) {
					if(err) {
						console.log('Error in folder creation'+ err);
						error();
					}else{
						dirCheck('uploads/user'+profileId+'/');
					}
				});
			};
		}else{
			dirCheck('uploads/user'+profileId+'/');
		}
	});
}

module.exports = imageController;
