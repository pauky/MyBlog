var express = require('express');
var routes = require('./routes'); // './' is necessary
var path = require('path');
var session = require('express-session');
var flash = require('connect-flash');
var config = require('./config');
var app = express();

//app.use(express.bodyParser());//格式化表单数据
//app.use(express.methodOverride()); //connect 内建的中间件，可以协助处理 POST 请求，伪装 PUT、DELETE 和其他 HTTP 方法。
app.use(flash()); //页面通知
//oAuth
var passport = require('passport'),
    GithubStrategy = require('passport-github').Strategy;

app.use(session({
    secret: config.sessionStr, // 建议使用 128 个字符的随机字符串
    cookie: { maxAge: config.maxAge }

}));

app.use(passport.initialize());//初始化 Passport
/*定义了一个 Passport 策略，并尝试从 GitHub 获得授权，从 GitHub 登陆并授权成功后以跳转到 callbackURL 并以 JSON 形式返回用户的一些相关信息，并将这些信息存储在 req.user 中。*/
passport.use(new GithubStrategy({
    clientID: config.clientID,
    clientSecret: config.clientSecret,
    callbackURL: config.callbackURL
}, function(accessToken, refreshToken, profile, done) {
    done(null, profile);
}));

app.set('view engine', 'ejs'); //设置视图模版引擎为 ejs

//connect 内建的中间件，设置根目录下的 public 文件夹为存放 image、css、js 等静态文件的目录。
app.use(express.static(path.join(__dirname, 'public')));

//保留上传文件的后缀名，并把上传目录设置为 /public/images （我们主要用来上传图片）
app.use(express.bodyParser({ keepExtensions: true, uploadDir: './public/imgs' }));
//connect 内建的中间件，可以协助处理 POST 请求，伪装 PUT、DELETE 和其他 HTTP 方法。
app.use(express.methodOverride());

routes(app);

app.listen(3000, function (req, res) {
	console.log('app is listening on port 3000');
});