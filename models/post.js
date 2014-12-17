var mongoose = require('mongoose');
var PostSchema = require('../schemas/post');
var User = require('./user');
var eventproxy = require('eventproxy');
var Post = mongoose.model('post', PostSchema);
var markdown = require('markdown').markdown;

Post.findById = function (id, callback) {
    return this
        .findOne({_id: id})
        .exec(callback);
};
Post.paging = function (page, callback) {
    var total = 0,
        skipSum,
        findReturnObj;
    findReturnObj = Post.find({}, function (err, posts) {
        if (err) {
            return callback(err);
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
                callback(err, posts, total);
            });
    });
};
// 首页文章展示（post leftjoin user）
Post.indexPostsPage = function (page, callback) {
    Post.paging(page, function (err, posts, total) {
        var ep = new eventproxy(),
            i;
        if (err) {
            console.log(err);
            return callback(err);
        }
        total = total || 0;
        if (posts.length > 0) {
            ep.after('findByAuthorId', posts.length, function (users) {
                var data = null;
                users.forEach(function (val, id, arr) {
                    if (val !== null) {
                        users[val._id] = val.username;
                    }
                });
                data = posts.map(function (post) {
                    var mo = post.toObject();
                    mo.author = users[post.authorId];
                    mo.content = markdown.toHTML(mo.content);
                    return mo;
                });
                callback(null, data, total);
            });
            posts.forEach(function (post) {
                User.findByCondition({_id: post.authorId}, function (err, user) {
                    if (err) {
                        console.log(err);
                    }
                    ep.emit('findByAuthorId', user);
                });
            });
        } else {
            callback(null, [], 0);
        }
    });
};

// 按点击数排序查询
Post.findByReadNum = function (n, callback) {
    return this.find({})
        .sort({'readNum': -1})
        .limit((n > 0 ? parseInt(n, 10) : 10))
        .exec(callback);
};
// 更新文章阅读次数
Post.updateReadNum = function (id, callback) {
    var that = this;
    this.findOne({_id: id}, function (err, post) {
        if (err) {
            console.log(err);
        }
        return that.update({_id: id}, {readNum: post.readNum + 1}).exec(callback);
    });
};

Post.findByCondition = function (conditionObj, page, callback) {
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
};
module.exports = Post;