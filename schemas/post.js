var mongoose = require('mongoose'),
	Q = require('q');

var PostSchema = new mongoose.Schema({
	title: String,
	content: String,
	authorId: String,
	readNum: Number,
	tagId: String,
	createAt: {
		type: Date,
		default: Date.now()
	},
	updateAt: {
		type: Date,
		default: Date.now()
	}
});



module.exports = PostSchema;