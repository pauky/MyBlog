var config = require('../config'),
    crypto = require('crypto'),
    utility = require('utility'),
    moment = require('moment'),
    markdown = require('markdown').markdown,
    validator = require('validator'),
    Models = require('../models'),
    User = Models.User,
    Post = Models.Post;

// 按作者显示文章
exports.u = function (req, res, next) {
    var userId = req.query.userId,
        username = req.query.username,
        page = req.query.p ? parseInt(req.query.p, 10) : 1;
    if (userId) {
        Post.findByConditionAndPage({authorId: userId}, page, function (err, posts, total) {
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
                tips: req.flash('success').toString() || req.flash('error').toString() || '',
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

// 个人主页
exports.personalPage = function (req, res, next) {
    res.render('personalPage', {
        title: 'Personal',
        tips: req.flash('success').toString() || req.flash('error').toString() || '',
        user: req.session.user,
        moment: moment
    });
};

// 用户信息分页
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

// 获取单个用户信息
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

// 修改用户密码
exports.revisePw = function (req, res, next) {
    var id = req.session.user.userId;
    var md5OriginPw = crypto.createHash('md5').update(req.body.originPw).digest('hex');
    var newPw = req.body.newPw;
    if (validator.trim(newPw) === '') {
        req.flash('error', '密码不能为空');
        return res.redirect('back');
    }
    if (newPw !== req.body.confirmPw) {
        req.flash('error', '两次密码不一致');
        return res.redirect('back');
    }
    User.findByCondition({_id: id}, function (err, user) {
        if (err) {
            console.log(err);
            return next(err);
        }
        if (md5OriginPw !== user.password) {
            req.flash('error', '密码不正确');
            return res.redirect('back');
        } else {
            User.update({_id: id}, {password: crypto.createHash('md5').update(newPw).digest('hex')}, {}, function(err, result) {
                if (err) {
                    console.log(err);
                    return next(err);
                }
                if (result) {
                    req.flash('success', '修改成功');
                    return res.redirect('back');
                } else {
                    req.flash('error', '修改失败');
                    return res.redirect('back');
                }
            });
        }        
    });
};

// 获取用户基本信息
exports.getUserInfo = function (req, res, next) {
    User.findByCondition({_id: req.session.user.userId}, function (err, user) {
        if (err) {
            console.log(err);
            return next(err);
        }
        res.end('{"username": "' + user.username + '"}');
    });
};
// 修改用户基本信息
exports.reviseUserInfo = function (req, res, next) {
    User.update({_id: req.session.user.userId}, {username: req.body.username}, {}, function(err, user) {
        if (err) {
            console.log(err);
            return next(err);
        }
        if (user) {
            req.flash('success', '修改成功！');
        } else {
            req.flash('error', '修改失败！');
        }
        res.redirect('back');
    });
};