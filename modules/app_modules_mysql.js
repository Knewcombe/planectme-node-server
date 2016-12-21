
var schemaObject = require('../node_modules/node-schema-object');
var mysql = require('../node_modules/mysql'); // mysql connection
var config = require('../config/config.js'); // get our config file

module.exports = mysql.createPool({
	connectionLimit : 10,
	host     : config.host,
	port		 : config.port,
	user     : config.user,
	password : config.password,
	database : config.database,
	socketPath: config.socketPath
});
