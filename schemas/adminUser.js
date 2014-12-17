var mongoose = require('mongoose');

var AdminUserSchema = new mongoose.Schema({
    adminname: String,
    password: String,
    head: String,
    email: String,
    state: Boolean
});


module.exports = AdminUserSchema;