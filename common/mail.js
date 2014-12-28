// 发邮件的模块

var nodemailer = require("nodemailer"),
    config = require('../config'),
    SITE_ROOT_URL = 'http://' + config.host + ':' + config.port;
exports.sendMail = function (who, token, name) {
// 开启一个 SMTP 连接池
var smtpTransport = nodemailer.createTransport("SMTP",{
  host: "smtp.163.com", // 主机
  secureConnection: true, // 使用 SSL
  port: 465, // SMTP 端口
  auth: {
    user: config.mailUser, // 账号
    pass: config.mailPassword // 密码
  }
});
console.log(who);
console.log(config.mailUser);
console.log(config.mailPassword);
// 设置邮件内容
var mailOptions = {
  from: config.name + "<glowrypauky@163.com>", // 发件地址
  to: who, // 收件列表
  subject: "Hello world", // 标题
  html: '<p>您好：' + name + '</p>' +
    '<p>我们收到您在' + config.name + '的注册信息，请点击下面的链接来激活帐户：</p>' +
    '<a href="' + SITE_ROOT_URL + '/active_account?key=' + token + '&name=' + name + '" target="_blank">激活链接</a>' +
    '<p>如果以上链接打不开，则复制以下url到浏览器地址栏中打开。</p>' + 
    '<p>' + SITE_ROOT_URL + '/active_account?key=' + token + '&name=' + name + '</p>' + 
    '<p>若您没有在' + config.name + '填写过注册信息，说明有人滥用了您的电子邮箱，请删除此邮件，我们对给您造成的打扰感到抱歉。</p>' +
    '<p>' + config.name + '谨上。</p>'
}
// 发送邮件
smtpTransport.sendMail(mailOptions, function(error, response) {
  if(error){
    console.log(error);
  }else{
    console.log("Message sent: " + response.message);
  }
  smtpTransport.close(); // 如果没用，关闭连接池
});

}