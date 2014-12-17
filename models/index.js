var mongoose = require('mongoose');
var config = require('../config');
// models
var User = require('./user');
var Post = require('./post');
var AdminUser = require('./adminUser');

mongoose.connect('mongodb://localhost/' + config.dbName, function (err) {
  if (err) {
    console.error('connect to %s error: ', config.dbName, err.message);
    process.exit(1);
  }
});



exports.User = User;
exports.Post = Post;
exports.AdminUser = AdminUser;
