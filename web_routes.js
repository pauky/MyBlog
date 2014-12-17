var config = require('./config'),
    passport = require('passport'),
    site = require('./controllers/site'),
    sign = require('./controllers/sign'),
    article = require('./controllers/article'),
    user = require('./controllers/user'),
    admin = require('./controllers/admin');

function app(app) {
    // 首页
    app.get('/', site.index);

    // 用户注册
    app.get('/reg', function (req, res) {
        res.render('reg', {
            title: 'Reg',
            tips: ''
        });
    });
    app.post('/reg', sign.reg);

    // 邮箱激活账号
    app.get('/active_account', sign.active_account);

    // 用户登录
    app.get('/userLogin', function (req, res) {
        res.render('login', {
            title: 'Login Page',
            tips: req.flash('error').toString() || ''
        });
    });
    app.post('/userLogin', sign.userLogin);

    // login out
    app.get('/logout', sign.checkLogin);
    app.get('/logout', sign.logout);

    //about
    app.get('/about', function (req, res) {
        res.render('about', {
            title: 'About',
            tips: '',
            user: req.session.user
        });
    });

    // upload
    app.post('/upload', article.upload);

    //post
    app.get('/post', sign.checkLogin);
    app.get('/post', function (req, res) {
        res.render('post', {
            title: 'Post',
            tips: req.flash('success').toString() || req.flash('error').toString() || '',
            user: req.session.user
        });
    });
    app.post('/post', sign.checkLogin);
    app.post('/post', article.post);

    // details
    app.get('/details', article.details);

    //user archives page
    app.get('/u', user.u);

    //user personal page
    app.get('/personalPage', sign.checkLogin);
    app.get('/personalPage', user.personalPage);

    //del post
    app.get('/delpost', sign.checkLogin);
    app.post('/delPost', article.delPost);

    //edit post
    app.get('/savePost', sign.checkLogin);
    app.post('/savePost', article.savePost);

    //post ajax paging
    app.post('/getPostPageInfo', sign.checkLogin);
    app.post('/getPostPageInfo', article.getPostPageInfo);

    //admin
    app.get('/admin', function (req, res) {
        res.render('admin', {
            title: 'Admin',
            tips: req.flash('error').toString() || ''
        });
    });
    app.post('/adminLogin', admin.adminLogin);
    app.get('/usersList', sign.checkAdminLogin);
    app.get('/usersList', function (req, res) {
        res.render('usersList', {
            title: 'usersList',
            tips: req.flash('error').toString() || ''
        });
    });

    //user ajax paging
    app.post('/getPostPageInfo', sign.checkAdminLogin);
    app.post('/getUserPageInfo', user.getUserPageInfo);

    app.post('/getUserInfo', sign.checkAdminLogin);
    app.post('/getUserInfo', user.getUserInfo);

    app.post('/saveUser', sign.checkAdminLogin);
    app.post('/saveUser', user.saveUser);
    app.post('/delUser', sign.checkAdminLogin);
    app.post('/delUser', user.delUser);
    //ajax
    app.get('/ajax', site.topTen);

    app.post('/getPostInfo', article.getPostInfo);
    
    /*这里我们可以直接使用 Express 的 session 功能，所以禁掉 Passport 的 session 功能，前面提到过 Passport 默认会将取得的用户信息存储在 req.user 中而不是 req.session.user，为了保持兼容，所以我们提取并序列化有用的数据保存到 req.session.user 中。*/
    app.get("/login/github", passport.authenticate("github", {session: false}));
    app.get("/login/github/callback", passport.authenticate("github", {
        session: false,
        failureRedirect: '/login',
        successFlash: '登陆成功！'
    }), function (req, res) {
        req.session.user = {name: req.user.username, head: req.user._json.avatar_url};
        res.redirect('/');
    });

}

module.exports = app;