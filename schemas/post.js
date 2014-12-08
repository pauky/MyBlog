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

PostSchema.statics = {
	fetch: function (callback) {
		return this
			.find({})
			.sort('meta.updateAt')
			.exec(callback);
	},
	findTen: function (callback) {
		return this
			.find({})
			.sort('meta.updateAt')
			.exec(callback);
	},
	findById: function (id, callback) {
		return this
			.findOne({_id: id})
			.exec(callback);
	},
	findByCondition: function (conditionObj, page, callback) {
		var total = 0;
		return this
			.find(conditionObj, function (err, posts) {
				if (err) {
					console.log(err);
				}
				total = posts.length;
			})
			.skip((page - 1) * 2)
			.limit(2)
			.sort({'meta.updateAt': -1})
			.exec(function(err,posts) {
				if (err) {
					console.log(err);
				}
				callback(null, posts, total);
			});
	},
	paging: function (page, callback) {
		var total = 0,
				skipSum,
				findReturnObj;
			findReturnObj = this.find({}, function (err, posts) {
				if (err) {
					console.log(err)
				}
				total = posts.length;
				if (total !== 0) {
					if ((page-1)*2 > total) {
						skipSum = 0;
					}else {
						skipSum = (page-1) * 2;
					}
				}else {
					skipSum = 0;
				}
				return findReturnObj
					.skip(skipSum)
					.limit(2)
					.sort({'meta.updateAt': -1})
					.exec(function(err,posts) {
						if (err) {
							console.log(err);
						}
						callback(null, posts, total);
					});
			});
	},
	findByUser: function (username, page, callback) {
		var total = 0;
		return this
			.find({author: username}, function (err, posts) {
				if (err) {
					console.log(err);
				}
				total = posts.length;
			})
			.skip((page - 1) * 2)
			.limit(2)
			.sort({'meta.updateAt': -1})
			.exec(function(err,posts) {
				callback(err, posts, total);
			});
	},
	removePost: function (id, authorId, callback) {
		return this
			.findOne({_id: id, authorId: authorId})
			.remove()
			.exec(callback);
	},
	editPost: function (id, title, content, callback) {
		return this
			.findOne({_id: id})
			.update({title: title, content: content})
			.exec(callback);
	},
	updateReadNum: function (id, callback) {
		var that = this;
		this.findOne({_id: id}, function (err, post) {
			if (err) {
				console.log(err);
			}
			return that.update({_id: id}, {readNum: post.readNum + 1}).exec(callback);
		});
	}
}

module.exports = PostSchema;