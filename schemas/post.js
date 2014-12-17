var mongoose = require('mongoose'),
		Q = require('q');

var PostSchema = new mongoose.Schema({
	title: String,
	content: String,
	authorId: String,
	readNum: Number,
	meta: {
		createAt: {
			type: Date,
			default: Date.now()
		},
		updateAt: {
			type: Date,
			default: Date.now()
		}
	}
});

PostSchema.pre('save', function (next) {
	if (this.isNew) {
		this.meta.createAt = this.meta.updateAt = Date.now();
	}else {
		this.meta.updateAt = Date.now();
	}
	next();
});


module.exports = PostSchema;