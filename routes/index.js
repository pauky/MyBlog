var config = require('../config'),
    passport = require('passport'),
    mongoose = require('mongoose'),
    Posts = require('../models/post'),
    Users = require('../models/user'),
    AdminUsers = require('../models/adminUsers'),
    _ = require('underscore'),
    moment = require('moment'),
    crypto = require('crypto'),
    Q = require('q'),
    eventproxy = require('eventproxy'),
    validator = require('validator'),
    markdown = require('markdown').markdown,
    fs = require('fs'),
    utility = require('utility'),
    mail = require('../common/mail');

mongoose.connect('mongodb://localhost/' + config.dbName);

function app(app) {

    //index
    app.get('/', function (req, res, next) {
        //判断是否是第一页，并把请求的页数转换成 number 类型
        var page = req.query.p ? parseInt(req.query.p, 10) : 1;
        Posts.paging(page, function (err, posts, total) {
            var ep = new eventproxy(),
                i,
                renderIndex = function (data) {
                    res.render('index', {
                        title: config.name,
                        tips: req.flash('success').toString() || req.flash('error').toString() || '',
                        posts: data,
                        user: req.session.user,
                        page: page,
                        isLastPage: page*2 >= total ? '1' : '',
                        isFirstPage: (total === 0) || (page === 1) ? '1' : ''
                    });
                };
            err = 1;
            if (err) {
                console.log(err);
                return next(err);
            }
            total = total || 0;
            if (posts.length > 0) {
                ep.after('findByAuthorId', posts.length, function (users) {
                    var data = null;
                    users.forEach(function (val, id, arr) {
                        if (val !== null) {
                            users[val._id] = val.username;
                        }
                    });
                    data = posts.map(function (post) {
                        var mo = post.toObject();
                        mo.author = users[post.authorId];
                        mo.content = markdown.toHTML(mo.content);
                        return mo;
                    });
                    renderIndex(data);
                });
                posts.forEach(function (post) {
                    Users.findByCondition({_id: post.authorId}, function (err, user) {
                        if (err) {
                            console.log(err);
                        }
                        ep.emit('findByAuthorId', user);
                    });
                });
            } else {
                renderIndex([]);
            }
        });
    });

    //reg 
    app.get('/reg', function (req, res) {
        res.render('reg', {
            title: 'Reg',
            tips: ''
        });
    });
    app.post('/reg', function (req, res) {
        var newUsername = req.body.username,
            password = req.body.password,
            confirmPw = req.body.confirmPw,
            email = req.body.email,
            md5;
        if (!(newUsername && password && confirmPw)) {
            req.flash('error', '用户名/密码/确认密码不能为空，请检查！');
            return res.redirect('/');
        }
        Users.findByCondition({username: newUsername}, function (err, user) {
            if (err) {
                console.log(err);
            }
            if (user) {
                req.flash('error', '用户已存在!');
                return res.redirect('/');
            }
            //password = req.body.password;
            //confirmPw = req.body.confirmPw;
            if (password !== confirmPw) {
                req.flash('error', '两次密码不相同'); 
                return res.redirect('/');
            }
            md5 = crypto.createHash('md5');
            md5Test = crypto.createHash('md5');
            email_MD5 = md5.update(email.toLowerCase()).digest('hex');
            password = md5Test.update(password).digest('hex')
            _user = new Users({
                username: newUsername,
                password: password,
                regMail: req.body.mail,
                head: 'https://gravatar.com/avatar/' + email_MD5 + '?s=48',
                email: email,
                state: false
            });
            _user.save(function (err) {
                if (err) {
                    console.log(err);
                }
                mail.sendMail(email, utility.md5(email + password + config.session_secret), newUsername);
                req.flash('success', '欢迎加入 ' + config.name + '！我们已给您的注册邮箱发送了一封邮件，请点击里面的链接来激活您的帐号。');
                return res.redirect('/');
            });
        });
    });
    app.get('/active_account', function (req, res, next) {
        var username = req.query.name,
                key = req.query.key,
                activeUser = null;
        Users.findByCondition({username: username}, function (err, user) {
            if (err) {
                return next(err);
            }
            if (!user) {
                req.flash('error', '激活链接错误');
                return res.redirect('/');
            } else if (user && key === utility.md5(user.email + user.password + config.session_secret)) {
                user.state = true;
                user.save(function (err) {
                    if (err) {
                        return next(err);
                    }
                    req.flash('success', '激活成功');
                    return res.redirect('/');
                });
            } else {
                req.flash('error', '激活链接错误');
                return res.redirect('/');
            }
        });
    });
    //login
    app.get('/userLogin', function (req, res) {
        res.render('login', {
            title: 'Login Page',
            tips: req.flash('error').toString() || ''
        });
    });
    app.post('/userLogin', function (req, res) {
        var username = req.body.username,
            md5;
        Users.findByCondition({username: username, state: true}, function (err, user) {
            if (err) {
                console.log(err);
            }
            if (user) {
                md5 = crypto.createHash('md5');
                if (md5.update(req.body.password).digest('hex') === user.password) {
                    req.session.user = {name: user.username, head: user.head, userId: user._id};
                    req.flash('success', '登陆成功！');
                    return res.redirect('/');
                }else {
                    req.flash('error', '密码不正确');
                    return res.redirect('back');
                }
            }else {
                req.flash('error', '用户不存在');
                return res.redirect('back');
            }
        });
    });
    //search
    app.get('/search/:id', function (req, res) {
        var id = req.params.id;

        Posts.findById(id, function (err, post) {
            res.render('detail', {
                title: 'Search',
                tips: '',
                post: post
            });
        });
    });
    //about
    app.get('/about', function (req, res) {
        res.render('about', {
            title: 'About',
            tips: '',
            user: req.session.user
        });
    });
    app.post('/upload', function (req, res) {
        var file = req.files.uploadImg,
                target_path,
                fileType,
                imgURL = '',
                error = '',
                jsontest = '';
        if (file.size === 0) {
            fs.unlinkSync(file.path); //删除临时文件（同步方式）
            error = '请指定上传文件';
        } else {
            fileType = file.type;
            console.log(fileType);
            if (file.size <= 8*1024*1024) {
                if (/^jpg$|^png$|^gif$|^jpeg$/i.test(fileType.replace('image/',''))) {
                    target_path = './public/imgs/' + file.name;
                    fs.renameSync(file.path, target_path); //重命名文件（同步方式）
                    imgURL = target_path.replace('./public/', '');
                } else {
                    fs.unlinkSync(file.path);
                    error = '文件格式不符合';
                }
            } else {
                fs.unlinkSync(file.path);
                error = '文件超过1MB';
            }
        }
        res.setHeader("Content-Type", "text/html");
        jsontest = {error: error, imgURL: imgURL};
        res.jsonp(jsontest);
    });
    //post
    app.get('/post', checkLogin);
    app.get('/post', function (req, res) {
        res.render('post', {
            title: 'Post',
            tips: req.flash('success').toString() || req.flash('error').toString() || '',
            user: req.session.user
        });
    });
    app.post('/post', function (req, res) {
        var id = req.body._id,
                postObj = req.body,
                _post,
                title = validator.trim(postObj.title)
                edit_error = title === '' ? '标题不能为空' : (title.lenght > 50) ? '标题过长' : '';

        if (edit_error) {
            req.flash('error',edit_error);
            return res.redirect('/post');
        } else {
            if (validator.trim(postObj.content) !== '') {
                _post = new Posts({
                    title: validator.escape(postObj.title),
                    content: postObj.content,
                    authorId: req.session.user.userId,
                    readNum: 0
                });
                _post.save(function (err) {
                    if (err) {
                        console.log(err);
                    }
                    req.flash('success', '发表成功');
                    return res.redirect('/post');
                });
            }else {
                req.flash('error','内容不能为空');
                return res.redirect('/post');
            }
        }
    });
    // details
    app.get('/details', function (req, res) {
        var id = req.query.id;
        if (id) {
            function findArchive() {
                var myDefer = Q.defer();
                Posts.findById(id, function (err, post) {
                    if (err) {
                        console.log(err);
                        myDefer.reject('系统运行错误，请联系管理员');
                    } else if (post) {
                        myDefer.resolve(post);
                    } else {
                        myDefer.reject({error: '无此文章'});
                    }
                });
                return myDefer.promise;
            }
            function findUser(post) {
                var myDefer = Q.defer();
                Users.findByCondition({_id: post.authorId}, function (err, user) {
                    if (err) {
                        console.log(err);
                        myDefer.reject('系统运行错误，请联系管理员');
                    } else if (user) {
                        post.author = user.username;
                        myDefer.resolve(post);
                    } else {
                        post.author = 'github游客';
                        myDefer.resolve(post);
                    }
                });
                return myDefer.promise;
            }
            function updateReadNum(msg) {
                var myDefer = Q.defer();
                Posts.updateReadNum(id, function (err) {
                    if (err) {
                        console.log(err);
                        myDefer.reject('系统运行错误，请联系管理员');
                    } else {
                        //myDefer.resolve(msg);
                        msg.content = markdown.toHTML(msg.content);
                        res.render('details', {
                            title: 'Details',
                            tips: '',
                            post: msg,
                            user: req.session.user
                        });
                    }
                });
                return myDefer.promise;
            }
            findArchive().then(function(msg){
                return findUser(msg);
            }).then(function (msg) {
                return updateReadNum(msg);
            }).fail(function (err) {
                req.flash('error',err);
                res.redirect('back');
            });
        }
    });
    //user archives page
    app.get('/u', function (req, res) {
        var userId = req.query.userId,
                username = req.query.username,
                page = req.query.p ? parseInt(req.query.p, 10) : 1;
        if (userId) {
            Posts.findByCondition({authorId: userId}, page, function (err, posts, total) {
                var data = [];
                if (err) {
                    console.log(err);
                }
                total = total || 0;
                // for (var i = 0; i < posts.length; i += 1) {
                //  posts[i].author = username;
                // }
                data = posts.map(function (post) {
                    var mo = post.toObject();
                    mo.author = username;
                    mo.content = markdown.toHTML(mo.content);
                    return mo;
                });
                res.render('userArchives', {
                    title: 'UserArchives',
                    tips: '',
                    posts: data,
                    user: req.session.user,
                    page: page,
                    isLastPage: page*2 >= total ? '1' : '',
                    isFirstPage: (total === 0) || (page === 1) ? '1' : '',
                    moment: moment
                });
            });
        } else {
            res.render('404');
        }
    });

    //user personal page
    app.get('/personalPage', checkLogin);
    app.get('/personalPage', function (req, res) {
        res.render('personalPage', {
            title: 'Personal',
            tips: '',
            user: req.session.user,
            moment: moment
        });
    });

    //del post
    app.get('/delpost', checkLogin);
    app.post('/delPost', function (req, res) {
        var id = req.body.id,
                userId = req.session.user.userId,
                page = req.body.p;
        Posts.remove({_id: req.body.id}, function (err, result) {
            if (err) {
                console.log(err);
            }
            if (result) {
                res.end('删除成功');
            }else {
                res.end('删除失败');
            }
        });
    });

    //edit post
    app.get('/savePost', checkLogin);
    app.post('/savePost', function (req, res) {
        var id = req.body.id,
                title = req.body.title,
                content = req.body.content;
        Posts.update({_id: id}, {title: title, content: content, meta:{updateAt: Date.now()}}, {}, function(err) {
            if (err) {
                console.log(err);
                res.end('修改失败');
            }
            res.end('修改成功');
        });
    });
    //post ajax paging
    app.post('/getPostPageInfo', checkLogin);
    app.post('/getPostPageInfo', function (req, res) {
        var userId = req.session.user.userId,
                page = req.body.page ? parseInt(req.body.page, 10) : 1;
            function findUser() {
                var myDefer = Q.defer();
                Users.findByCondition({_id: userId}, function (err, user) {
                    if (err) {
                        console.log(err);
                        myDefer.reject('系统运行错误，请联系管理员');
                    }
                    if (user) {
                        myDefer.resolve({user: user});
                    } else {
                        myDefer.reject('用户不存在');
                    }
                });
                return myDefer.promise;
            }
            function findArchive() {
                var myDefer = Q.defer();
                Posts.findByCondition({authorId: userId}, page, function (err, posts, total) {
                    if (err) {
                        console.log(err);
                        myDefer.reject('系统运行错误，请联系管理员');
                    }
                    total = total || 0;
                    myDefer.resolve({posts: posts, total: total});
                });
                return myDefer.promise;
            }
            //并行执行两个操作，当两者成功返回数据时就执行下面这个then
            Q.all([findUser(),findArchive()])
            .then(function (success) {
                var i = 0,
                        posts = null,
                        user = null,
                        total,
                        data = null,
                        isLastPage,
                        isFirstPage;
                success.forEach(function (ele, id) {
                    if (ele.posts) {
                        posts = ele.posts;
                        total = ele.total;
                    } else if (ele.user) {
                        user = ele.user;
                    }
                });
                data = posts.map(function (post, id) {
                    var mo = post.toObject(); //将mongoose返回的文档转换为对象
                    mo.author = user.username;
                    mo.meta.updateAt = moment(mo.meta.updateAt).format('MMM Do YY');
                    return mo;
                });
                /*posts.forEach(function (post, id) {
                    post._doc.author = user.username; //返回的数据存储在mongoose返回的文档属性_doc里
                    post._doc.meta.updateAt = moment(post._doc.meta.updateAt).format('MMM Do YY');
                });*/
                isLastPage = (page*2 >= total) ? '1' : '';
                isFirstPage = (total === 0) || (page === 1) ? '1' : '';
                res.end('{"posts": '+JSON.stringify(data)+', "total": "'+total+'", "isLastPage": "'
                    +isLastPage+'", "isFirstPage": "'+isFirstPage+'"}');
            }).fail(function (err) {
                req.flash('error', err);
                res.redirect('back');
            });
    });
    //admin
    app.get('/admin', function (req, res) {
        res.render('admin', {
            title: 'Admin',
            tips: req.flash('error').toString() || ''
        });
    });
    app.post('/adminLogin', function (req, res) {
        var adminname = req.body.adminname,
            password = req.body.password;
        if (!(adminname && password)) {
            req.flash('error', '请填写完整信息');
            res.redirect('back');
        } else {
            AdminUsers.findByCondition({adminname: adminname}, function (err, admin) {
                if (err) {
                    console.log(err);
                }
                if (admin) {
                    md5 = crypto.createHash('md5');
                    if (md5.update(password).digest('hex') === admin.password) {
                        req.session.admin = {name: admin.username, head: admin.head, userId: admin._id};
                        req.flash('success', '登陆成功！');
                        return res.redirect('/usersList');
                    }else {
                        req.flash('error', '密码不正确');
                        return res.redirect('back');
                    }
                } else {
                    req.flash('error', '用户名不存在');
                    return res.redirect('back');
                }
            })
        }
    });
    app.get('/usersList', checkAdminLogin);
    app.get('/usersList', function (req, res) {
        res.render('usersList', {
            title: 'usersList',
            tips: req.flash('error').toString() || ''
        });
    });
    //user ajax paging
    // app.post('/getPostPageInfo', checkLogin);
    app.post('/getUserPageInfo', function (req, res) {
        console.log(1);
        // var userId = req.session.user.userId,
        var page = req.body.page ? parseInt(req.body.page, 10) : 1;
        Users.paging(page, function (err, users, total) {
            console.log(2);
            console.log(users);
            var data = [];
            if (err) {
                console.log(err);
            }
            total = total || 0;
            if (users) {
                data = users.map(function (user, id) {
                    var mo = user.toObject(); //将mongoose返回的文档转换为对象
                    return mo;
                });
                isLastPage = (page*2 >= total) ? '1' : '';
                isFirstPage = (total === 0) || (page === 1) ? '1' : '';
                
            } else {
                
            }
            res.end('{"users": '+JSON.stringify(data)+', "total": "'+total+'", "isLastPage": "'
                    +isLastPage+'", "isFirstPage": "'+isFirstPage+'"}');
        });
    });
    // 增加管理员
    app.get('/adminReg', function (req, res) {
        res.render('adminReg', {
            title: 'Admin',
            tips: req.flash('error').toString() || ''
        });
    });
    app.post('/adminReg', function (req, res) {
        var newUsername = req.body.username,
            password = req.body.password,
            confirmPw = req.body.confirmPw,
            email = req.body.email,
            md5;
        if (!(newUsername && password && confirmPw)) {
            req.flash('error', '用户名/密码/确认密码不能为空，请检查！');
            return res.redirect('/');
        }
        AdminUsers.findByCondition({adminname: newUsername}, function (err, user) {
            if (err) {
                console.log(err);
            }
            if (user) {
                req.flash('error', '用户已存在!');
                return res.redirect('/');
            }
            //password = req.body.password;
            //confirmPw = req.body.confirmPw;
            if (password !== confirmPw) {
                req.flash('error', '两次密码不相同'); 
                return res.redirect('/');
            }
            md5 = crypto.createHash('md5');
            md5Test = crypto.createHash('md5');
            email_MD5 = md5.update(email.toLowerCase()).digest('hex');
            password = md5Test.update(password).digest('hex')
            _user = new AdminUsers({
                adminname: newUsername,
                password: password,
                eail: email,
                head: 'https://gravatar.com/avatar/' + email_MD5 + '?s=48',
                state: false
            });
            _user.save(function (err) {
                if (err) {
                    console.log(err);
                }
                // mail.sendMail(email, utility.md5(email + password + config.session_secret), newUsername);
                // req.flash('success', '欢迎加入 ' + config.name + '！我们已给您的注册邮箱发送了一封邮件，请点击里面的链接来激活您的帐号。');
                req.flash('success', '注册管理员成功');
                return res.redirect('/');
            });
        });
    });
    app.post('/getUserInfo', checkAdminLogin);
    app.post('/getUserInfo', function (req, res) {
        var id = req.body.id;
        Users.findByCondition({_id: id}, function (err, user) {
            if (err) {
                console.log(err);
            }
            res.jsonp(user);
        });
    });
    app.post('/saveUser', checkAdminLogin);
    app.post('/saveUser', function (req, res) {
        Users.update({_id: req.body.id}, {username: req.body.username, email: req.body.email, head: req.body.head, state: req.body.state}, {}, function(err) {
            if (err) {
                console.log(err);
                res.end('修改失败');
            }
            res.end('修改成功');
        });
    });
    app.post('/delUser', checkAdminLogin);
    app.post('/delUser', function (req, res) {
        Users.remove({_id: req.body.id}, function (err, result) {
            if (err) {
                console.log(err);
            }
            if (result) {
                res.end('删除成功');
            }else {
                res.end('删除失败');
            }
        });
    });
    //ajax
    app.get('/ajax', function (req, res) {
        Posts.findByReadNum(10, function (err, posts) {
            if (err) {
                console.log(err);
            }
            res.end(JSON.stringify(posts));
        });
    });
    app.post('/getPostInfo', function (req, res) {
        var id = req.body.id;
        Posts.findById(id, function (err, post) {
            if (err) {
                console.log(err);
            }
            res.jsonp(post);
        });
    });
    //login out
    app.get('/logout', checkLogin);
    app.get('/logout', function (req, res) {
        req.session.user = null;
        req.flash('success', '登出成功!');
        return res.redirect('/');//登出成功后跳转到主页
    });
    
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

    

    //检查用户登录状态
    function checkLogin(req, res, next) {
        if (!req.session.user) {
            req.flash('error', '未登录!');
            return res.redirect('/');
        }
        next();
    }
    function checkNotLogin(req, res, next) {
        if (req.session.user) {
            req.flash('error', '已登录!'); 
            return res.redirect('back');//返回之前的页面
        }
        next();
    }

    // 检查管理员登录状态
    function checkAdminLogin (req, res, next) {
        if (!req.session.admin) {
            req.flash('error', '没有管理权限')
            return res.redirect('back');
        }
        next();
    }
    function checkAdminNotLogin (req, res, next) {
        if (req.session.admin) {
            req.flash('error', '已是管理身份登录');
            return res.redirect('back');
        }
        next();
    }
}
module.exports = app;