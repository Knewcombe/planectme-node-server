var schemaObject = require('../node_modules/node-schema-object');       	// schemaObject

module.exports = new schemaObject({
	profile_id: String,
	gender: String,
	country: String
});
