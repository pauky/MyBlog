var mongoose = require('mongoose');
var AdminUsersSchema = require('../schemas/adminUsers')
var adminUsers = mongoose.model('adminUsers', AdminUsersSchema);

module.exports = adminUsers;