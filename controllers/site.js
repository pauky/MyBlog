var config = require('../config'),
    moment = require('moment'),
    Models = require('../models'),
    Post = Models.Post,
    Tag = Models.Tag;

exports.index = function (req, res, next) {
    //判断是否是第一页，并把请求的页数转换成 number 类型
    var page = req.query.p ? parseInt(req.query.p, 10) : 1;
    Post.postsPage(page, {}, function (err, data, total) {
        if (err) {
            console.log(err);
            return next(err);
        }
        res.render('index', {
            title: config.name,
            tips: req.flash('success').toString() || req.flash('error').toString() || '',
            posts: data,
            user: req.session.user,
            page: page,
            moment: moment,
            isLastPage: page*2 >= total ? '1' : '',
            isFirstPage: (total === 0) || (page === 1) ? '1' : ''
        });
    });
};

// 取点击数前十的文章
exports.topTen = function (req, res, next) {
    Post.findByReadNum(10, function (err, posts) {
        if (err) {
            console.log(err);
            return next(err);
        }
        res.end(JSON.stringify(posts));
    });
};
