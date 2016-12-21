
//User modules
var schemaObject = require('../node_modules/node-schema-object');       	// schemaObject

module.exports = new schemaObject({
	user_id: String,
	profile_id: String,
	first_name: String,
	last_name: String,
	date_of_birth: Date,
	user_email: String
});
