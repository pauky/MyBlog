var config = require('../config'),
    crypto = require('crypto'),
    utility = require('utility'),
    mail = require('../common/mail'),
    User = require('../models').User;

exports.getReg = function (req, res, next) {
    if (config.userReg) {
        res.render('reg', {
            title: 'Reg',
            tips: ''
        });
    } else {
        req.flash('error', '当前注册功能关闭');
        return res.redirect('back');
    }
};

exports.postReg = function (req, res, next) {
    var newUsername = req.body.username,
        password = req.body.password,
        confirmPw = req.body.confirmPw,
        email = req.body.email,
        md5;
    if (!(newUsername && password && confirmPw)) {
        req.flash('error', '用户名/密码/确认密码不能为空，请检查！');
        return res.redirect('back');
    }
    User.findByCondition({username: newUsername}, function (err, user) {
        if (err) {
            console.log(err);
            return next(err);
        }
        if (user) {
            req.flash('error', '用户已存在!');
            return res.redirect('back');
        }
        if (password !== confirmPw) {
            req.flash('error', '两次密码不相同'); 
            return res.redirect('/');
        }
        md5 = crypto.createHash('md5');
        md5Test = crypto.createHash('md5');
        email_MD5 = md5.update(email.toLowerCase()).digest('hex');
        password = md5Test.update(password).digest('hex')
        _user = new User({
            username: newUsername,
            password: password,
            regMail: req.body.mail,
            head: 'https://gravatar.com/avatar/' + email_MD5 + '?s=48',
            email: email,
            state: false
        });
        _user.save(function (err) {
            if (err) {
                console.log(err);
                return next(err);
            }
            mail.sendMail(email, utility.md5(email + password + config.session_secret), newUsername);
            req.flash('success', '欢迎加入 ' + config.name + '！我们已给您的注册邮箱发送了一封邮件，请点击里面的链接来激活您的帐号。');
            return res.redirect('/');
        });
    });
};

exports.active_account = function (req, res, next) {
    var username = req.query.name,
        key = req.query.key,
        activeUser = null;
    User.findByCondition({username: username}, function (err, user) {
        if (err) {
            return next(err);
        }
        if (!user) {
            req.flash('error', '激活链接错误');
            return res.redirect('/');
        } else if (user && key === utility.md5(user.email + user.password + config.session_secret)) {
            user.state = true;
            user.save(function (err) {
                if (err) {
                    console.log(err);
                    return next(err);
                }
                req.flash('success', '激活成功');
                return res.redirect('/');
            });
        } else {
            req.flash('error', '激活链接错误');
            return res.redirect('/');
        }
    });
};

exports.userLogin = function (req, res, next) {
    var username = req.body.username,
        md5;
    User.findByCondition({username: username, state: true}, function (err, user) {
        if (err) {
            console.log(err);
            return next(err);
        }
        if (user) {
            md5 = crypto.createHash('md5');
            if (md5.update(req.body.password).digest('hex') === user.password) {
                req.session.user = {name: user.username, head: user.head, userId: user._id};
                req.flash('success', '登陆成功！');
                return res.redirect('/');
            }else {
                req.flash('error', '密码不正确');
                return res.redirect('back');
            }
        }else {
            req.flash('error', '用户不存在');
            return res.redirect('back');
        }
    });
};


// 用户登出
exports.logout = function (req, res, next) {
    req.session.user = null;
    req.flash('success', '登出成功!');
    return res.redirect('/');//登出成功后跳转到主页
};

//检查用户登录状态
exports.checkLogin = function (req, res, next) {
    if (!req.session.user) {
        req.flash('error', '未登录!');
        return res.redirect('/');
    }
    next();
};
exports.checkNotLogin = function (req, res, next) {
    if (req.session.user) {
        req.flash('error', '已登录!'); 
        return res.redirect('back');//返回之前的页面
    }
    next();
};

// 检查管理员登录状态
exports.checkAdminLogin = function (req, res, next) {
    if (!req.session.admin) {
        req.flash('error', '没有管理权限')
        return res.redirect('back');
    }
    next();
};
exports.checkAdminNotLogin = function (req, res, next) {
    if (req.session.admin) {
        req.flash('error', '已是管理身份登录');
        return res.redirect('back');
    }
    next();
};

