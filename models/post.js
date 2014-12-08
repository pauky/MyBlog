var mongoose = require('mongoose');
var PostSchema = require('../schemas/post');
var Post = mongoose.model('post', PostSchema);

module.exports = Post;