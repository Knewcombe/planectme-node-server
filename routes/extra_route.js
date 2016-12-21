var express  = require('../node_modules/express');
var extraApp = express.Router();
var connection = require('../modules/app_modules_mysql.js');
var mysqlQuery = require('../constance/mysql_constance');

	extraApp.get('/contry_data', function(req, res){
		var countries = require('country-data').countries;
		res.json(countries.all);
	});

	module.exports = extraApp;
