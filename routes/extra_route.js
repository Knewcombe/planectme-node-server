var express  = require('../node_modules/express');
var extraApp = express.Router();
var ejs = require('ejs')
var url = require('url');
var fs = require('fs');
var connection = require('../modules/app_modules_mysql.js');
var mysqlQuery = require('../constance/mysql_constance');
var config = require('../config/config.js');
var mailer = require('../node_modules/nodemailer')
var smtpTransport = require('../node_modules/nodemailer-smtp-transport');

	extraApp.get('/contry_data', function(req, res){
		var countries = require('country-data').countries;
		res.json(countries.all);
	});

	extraApp.post('/report_user', function(req, res){
		console.log(req.body.profileId);
		var profileId = req.body.profileId
		//Here is where the information will get done
		//no repsonce is technacly needed, but could be.
		let mail = mailer.createTransport(smtpTransport({
    	host: config.email_server,
    	port: config.email_port,
    	auth: {
        user: config.email_user,
        pass: config.email_pass
    	}
		}))

		connection.query(
			'INSERT INTO report_user (user_id) VALUES ((SELECT user_id FROM user_account WHERE profile_id = '+profileId+'))',
			function(err,rows){
				if(err) throw err;
				console.log(rows.insertId)
				// setup email data with unicode symbols
				let mailOptions = {
				    from: config.email_user, // sender address
				    to: 'kylen@checkmatesolutions.ca', // list of receivers
				    subject: 'User Report', // Subject line
				    text: 'http://localhost:8080/extra/report/'+rows.insertId, // plain text body
				    //html: '<b>Hello world ?</b>'
				};

				mail.sendMail(mailOptions, (error, info) => {
				    if (error) {
				        return console.log(error);
				    }
				    console.log('Message %s sent: %s', info.messageId, info.response);
						res.send(true);
				});
			}
		);

		// send mail with defined transport object

	})
	//This will only be avalible in the home server.
	extraApp.get('/report/:reportId', function(req, res){
		console.log(req.params.reportId);
		var reportId = req.params.reportId;
		var profileId = 0;
		var body = '';
		connection.query(
			'SELECT * FROM user_account WHERE user_id = (SELECT user_id FROM report_user WHERE report_id = '+reportId+')',
			function(err,rows){
				if(err) throw err;
				console.log(rows[0]);
				profileId = rows[0].profile_id
				body += '<a href="http://localhost:8080/extra/report/remove/'+reportId+'" class="button">Remove</a>'+
				'<a href="http://localhost:8080/extra/report/ignore/'+reportId+'" class="button">Ignore</a>'+
				'<p><strong> user_id:</strong> '+rows[0].user_id+'</p>'+
				'<p><strong> first_name:</strong> '+rows[0].first_name+'</p>'+
				'<p><strong> last_name:</strong> '+rows[0].last_name+'</p>'+
				'<p><strong> profile_id:</strong> '+rows[0].profile_id+'</p>'+
				'<p><strong> user_email: </strong>'+rows[0].user_email+'</p>'+
				'<p><strong> date_of_birth:</strong> '+rows[0].date_of_birth+'</p>'
				connection.query(
					'SELECT image_location FROM profile_pic WHERE profile_id = '+profileId,
					function(err,rows){
						if(err) throw err;
						console.log(rows);
						for(var i = 0; rows.length > i; i++){
							if (fs.existsSync(rows[i].image_location)) {
								//Need to the the base64 image first I assume before I could deliver it.
								var extention = rows[i].image_location.split('.')[1]
								console.log(extention)
								if(extention == 'jpg'){
									body += '<img src= data:image/jpeg;base64,'+new Buffer(fs.readFileSync(rows[i].image_location)).toString('base64')+'>'
								}else if(extention == 'png'){
									body += '<img src= data:image/png;base64,'+new Buffer(fs.readFileSync(rows[i].image_location)).toString('base64')+'>'
								}
							}
						}
						res.render('report_view.ejs', { title: body })
					}
				);
			}
		);
	})

	extraApp.get('/report/remove/:reportId', function(req, res){
		var reportId = req.params.reportId;
		connection.query(
			'SELECT * FROM user_account WHERE user_id = (SELECT user_id FROM report_user WHERE report_id = '+reportId+')',
			function(err,rows){
				if(err) throw err;
				console.log(rows[0]);
				console.log('Removing user');
				var profile_id = rows[0].profile_id;
				var user_email = rows[0].user_email;
				var user_name = rows[0].first_name +' '+ rows[0].last_name
				//Remove Images from server first.
				connection.query(
					'DELETE FROM user_profile WHERE profile_id ='+profile_id+';',
					function(err, rows){
						if(err) throw err
						console.log(rows);
						//Send an email to user thier account has been removed
						let mailOptions = {
						    from: user_email, // sender address
						    to: user_email, // list of receivers
						    subject: 'Profile Has been removed', // Subject line
						    text: 'Dear '+ user_name +', '+
								'Your account has been delete from Plannectme because of inappropriate content in your profile.', // plain text body
						    //html: '<b>Hello world ?</b>'
						};
						//Send message to the server client user the profile has been removed.
						mail.sendMail(mailOptions, (error, info) => {
						    if (error) {
						        return console.log(error);
						    }
						    console.log('Message %s sent: %s', info.messageId, info.response);
								res.render('report_complete.ejs', { message: '<p>Complete: User has been removed and a message has been sent.</p>'})
						});
					}
				)
			}
		);
	})

	extraApp.get('/report/ignore/:reportId', function(req, res){
		var reportId = req.params.reportId;
		connection.query(
			'DELETE FROM report_user WHERE report_id ='+reportId+';',
			function(err, rows){
				if(err) throw err
				console.log('Done');
				res.render('report_complete.ejs', { message: '<p>Complete: Report has been removed, user will remain on site.</p>'})
			}
		)
	})

	module.exports = extraApp;
