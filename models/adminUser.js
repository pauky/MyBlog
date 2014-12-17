var mongoose = require('mongoose');
var AdminUserSchema = require('../schemas/adminUser')
var AdminUser = mongoose.model('adminUser', AdminUserSchema);

AdminUser.findByCondition = function (conditionObj, callback) {
    return this
        .findOne(conditionObj)
        .exec(callback);
};
// 分页
AdminUser.paging = function (page, callback) {
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
};

module.exports = AdminUser;