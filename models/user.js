var mongoose = require('mongoose');
var UserSchema = require('../schemas/user')
var User = mongoose.model('user', UserSchema);

User.fetch = function (callback) {
    return this
        .find({})
        .exec(callback);
};
User.findByCondition = function (conditionObj, callback) {
    return this
        .findOne(conditionObj)
        .exec(callback);
};
User.paging = function (page,callback) {
    var total = 0;
    return this
        .find({}, function (err, posts) {
            if (err) {
                console.log(err);
            }
            total = posts.length;
        })
        .skip((page - 1) * 2)
        .limit(2)
        .exec(function(err,posts) {
            if (err) {
                console.log(err);
            }
            callback(null, posts, total);
        });
};

module.exports = User;