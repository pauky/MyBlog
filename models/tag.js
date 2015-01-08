var mongoose = require('mongoose');
var TagSchema = require('../schemas/tag')
var Tag = mongoose.model('tag', TagSchema);

Tag.fetch = function (callback) {
    return this
        .find({})
        .exec(callback);
};
Tag.findByCondition = function (conditionObj, callback) {
    return this
        .findOne(conditionObj)
        .exec(callback);
};
// 更新标签文章数
Tag.updatePostNum = function (id, action, callback) {
    var that = this;
    this.findOne({_id: id}, function (err, tag) {
        var postNum = 0;
        if (err) {
            console.log(err);
        }
        if (action === 'add') {
            postNum = tag.postNum + 1;
        } else {
            postNum = tag.postNum - 1;
        }
        return that.update({_id: id}, {postNum: postNum}).exec(callback);
    });
};
module.exports = Tag;