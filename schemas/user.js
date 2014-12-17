var mongoose = require('mongoose');

var UserSchema = new mongoose.Schema({
	username: String,
	password: String,
	regMail: String,
	head: String,
	email: String,
	state: Boolean
});


module.exports = UserSchema;