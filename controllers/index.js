var config = require('config'),
    mongoose = require('mongoose');

exports.index = function (req, res, next) {
        //判断是否是第一页，并把请求的页数转换成 number 类型
        var page = req.query.p ? parseInt(req.query.p, 10) : 1;
        Posts.paging(page, function (err, posts, total) {
            var ep = new eventproxy(),
                i,
                renderIndex = function (data) {
                    res.render('index', {
                        title: config.name,
                        tips: req.flash('success').toString() || req.flash('error').toString() || '',
                        posts: data,
                        user: req.session.user,
                        page: page,
                        isLastPage: page*2 >= total ? '1' : '',
                        isFirstPage: (total === 0) || (page === 1) ? '1' : ''
                    });
                };
            if (err) {
                console.log(err);
                return next(err);
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
                    renderIndex(data);
                });
                posts.forEach(function (post) {
                    Users.findByCondition({_id: post.authorId}, function (err, user) {
                        if (err) {
                            console.log(err);
                        }
                        ep.emit('findByAuthorId', user);
                    });
                });
            } else {
                renderIndex([]);
            }
        });
    }