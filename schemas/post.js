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
	// 查找所有
	fetch: function (callback) {
		return this
			.find({})
			.sort('meta.updateAt')
			.exec(callback);
	},
	// 找前十条
	findTen: function (callback) {
		return this
			.find({})
			.sort('meta.updateAt')
			.limit(10)
			.exec(callback);
	},
	// 按_id查找一条
	findById: function (id, callback) {
		return this
			.findOne({_id: id})
			.exec(callback);
	},
	// 按特定条件查找
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
	// 分页
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
	// 按用户查找
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
	// 删除文章
	// removePost: function (id, authorId, callback) {
	// 	return this
	// 		.findOne({_id: id, authorId: authorId})
	// 		.remove()
	// 		.exec(callback);
	// },
	// 编辑文章
	editPost: function (id, title, content, callback) {
		return this
			.findOne({_id: id})
			.update({title: title, content: content})
			.exec(callback);
	},
	// 找出阅读次数降序前n条
	findByReadNum: function (n, callback) {
		return this.find({})
			.sort({'readNum': -1})
			.limit((n > 0 ? parseInt(n, 10) : 10))
			.exec(callback);
	},
	// 更新文章阅读次数
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