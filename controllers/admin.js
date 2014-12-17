var config = require('../config'),
    crypto = require('crypto'),
    AdminUser = require('../models').AdminUser;

exports.adminLogin = function (req, res, next) {
    var adminname = req.body.adminname,
        password = req.body.password;
    if (!(adminname && password)) {
        req.flash('error', '请填写完整信息');
        res.redirect('back');
    } else {
        AdminUser.findByCondition({adminname: adminname}, function (err, admin) {
            if (err) {
                console.log(err);
                return next(err);
            }
            if (admin) {
                md5 = crypto.createHash('md5');
                if (md5.update(password).digest('hex') === admin.password) {
                    req.session.admin = {name: admin.username, head: admin.head, userId: admin._id};
                    req.flash('success', '登陆成功！');
                    return res.redirect('/usersList');
                }else {
                    req.flash('error', '密码不正确');
                    return res.redirect('back');
                }
            } else {
                req.flash('error', '用户名不存在');
                return res.redirect('back');
            }
        })
    }
};