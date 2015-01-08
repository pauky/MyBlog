var mongoose = require('mongoose');

var TagSchema = new mongoose.Schema({
	name: String,
	postNum: Number
});


module.exports = TagSchema;