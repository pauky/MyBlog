var config = require('../config'),
    crypto = require('crypto'),
    utility = require('utility'),
    moment = require('moment'),
    User = require('../models').User,
    Post = require('../models').Post;

exports.u = function (req, res, next) {
    var userId = req.query.userId,
        username = req.query.username,
        page = req.query.p ? parseInt(req.query.p, 10) : 1;
    if (userId) {
        Post.findByCondition({authorId: userId}, page, function (err, posts, total) {
            var data = [];
            if (err) {
                console.log(err);
                return next(err);
            }
            total = total || 0;
            data = posts.map(function (post) {
                var mo = post.toObject();
                mo.author = username;
                mo.content = markdown.toHTML(mo.content);
                return mo;
            });
            res.render('userArchives', {
                title: 'UserArchives',
                tips: '',
                posts: data,
                user: req.session.user,
                page: page,
                isLastPage: page*2 >= total ? '1' : '',
                isFirstPage: (total === 0) || (page === 1) ? '1' : '',
                moment: moment
            });
        });
    } else {
        res.render('404');
    }
};
exports.personalPage = function (req, res, next) {
    res.render('personalPage', {
        title: 'Personal',
        tips: '',
        user: req.session.user,
        moment: moment
    });
};
exports.getUserPageInfo = function (req, res) {
    var page = req.body.page ? parseInt(req.body.page, 10) : 1;
    User.paging(page, function (err, users, total) {
        var data = [];
        if (err) {
            console.log(err);
            return next(err);
        }
        total = total || 0;
        if (users) {
            data = users.map(function (user, id) {
                var mo = user.toObject(); //将mongoose返回的文档转换为对象
                return mo;
            });
            isLastPage = (page*2 >= total) ? '1' : '';
            isFirstPage = (total === 0) || (page === 1) ? '1' : '';
            
        }
        res.end('{"users": '+JSON.stringify(data)+', "total": "'+total+'", "isLastPage": "'
                +isLastPage+'", "isFirstPage": "'+isFirstPage+'"}');
    });
};

exports.getUserInfo = function (req, res, next) {
    var id = req.body.id;
    User.findByCondition({_id: id}, function (err, user) {
        if (err) {
            console.log(err);
            return next(err);
        }
        res.jsonp(user);
    });
};

exports.saveUser = function (req, res, next) {
    User.update({_id: req.body.id}, {username: req.body.username, email: req.body.email, head: req.body.head, state: req.body.state}, {}, function(err, result) {
        if (err) {
            console.log(err);
            return next(err);
        }
        if (result) {
            res.end('修改成功');
        } else {
            res.end('修改失败');
        }
    });
};

exports.delUser = function (req, res, next) {
    User.remove({_id: req.body.id}, function (err, result) {
        if (err) {
            console.log(err);
            return next(err);
        }
        if (result) {
            res.end('删除成功');
        }else {
            res.end('删除失败');
        }
    });
};