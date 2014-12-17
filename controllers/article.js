var config = require('../config'),
    Post = require('../models').Post,
    User = require('../models').User,
    validator = require('validator'),
    markdown = require('markdown').markdown,
    moment = require('moment'),
    Q = require('q'),
    fs = require('fs');

exports.upload = function (req, res, next) {
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
};

exports.post = function (req, res, next) {
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
            _post = new Post({
                title: validator.escape(postObj.title),
                content: postObj.content,
                authorId: req.session.user.userId,
                readNum: 0
            });
            _post.save(function (err) {
                if (err) {
                    console.log(err);
                    return next(err);
                }
                req.flash('success', '发表成功');
                return res.redirect('/post');
            });
        }else {
            req.flash('error','内容不能为空');
            return res.redirect('/post');
        }
    }
};

exports.details = function (req, res, next) {
    var id = req.query.id;
    if (id) {
        function findArchive() {
            var myDefer = Q.defer();
            Post.findById(id, function (err, post) {
                if (err) {
                    console.log(err);
                    myDefer.reject(err);
                } else if (post) {
                    myDefer.resolve(post);
                } else {
                    myDefer.reject('');
                }
            });
            return myDefer.promise;
        }
        function findUser(post) {
            var myDefer = Q.defer();
            if (post) {
                User.findByCondition({_id: post.authorId}, function (err, user) {
                    // console.log(user);
                    if (err) {
                        console.log(err);
                        myDefer.reject(err);
                    } else if (user) {
                        post.author = user.username;
                        myDefer.resolve(post);
                    } else {
                        post.author = 'github游客';
                        myDefer.resolve(post);
                    }
                });
            } else {
                myDefer.resolve('');
            }
            return myDefer.promise;
        }
        function updateReadNum(msg) {
            var myDefer = Q.defer();
            if (msg) {
                Post.updateReadNum(id, function (err) {
                    if (err) {
                        console.log(err);
                        myDefer.reject(err);
                    } else {
                        msg.content = markdown.toHTML(msg.content);
                        res.render('details', {
                            title: 'Details',
                            tips: '',
                            post: msg,
                            user: req.session.user
                        });
                    }
                });
            } else {
                res.render('details', {
                    title: 'Details',
                    tips: '',
                    post: {},
                    user: req.session.user
                });
            }
            return myDefer.promise;
        }
        findArchive().then(function(msg){
            return findUser(msg);
        }).then(function (msg) {
            return updateReadNum(msg);
        }).fail(function (err) {
            console.log(err);
            return next(err);
        });
    } else {
        res.render('404');
    }
};

exports.delPost = function (req, res, next) {
    var id = req.body.id,
        userId = req.session.user.userId,
        page = req.body.p;
    Post.remove({_id: req.body.id}, function (err, result) {
        if (err) {
            console.log(err);
            return next(err);
        }
        if (result) {
            res.end('删除成功');
        }else {
            res.end('删除失败');
        }
    });
};

exports.savePost = function (req, res) {
    var id = req.body.id,
            title = req.body.title,
            content = req.body.content;
    Post.update({_id: id}, {title: title, content: content, meta:{updateAt: Date.now()}}, {}, function(err) {
        if (err) {
            console.log(err);
            res.end('修改失败');
        }
        res.end('修改成功');
    });
};

exports.getPostPageInfo = function (req, res, next) {
    var userId = req.session.user.userId,
            page = req.body.page ? parseInt(req.body.page, 10) : 1;
    function findUser() {
        var myDefer = Q.defer();
        User.findByCondition({_id: userId}, function (err, user) {
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
        Post.findByCondition({authorId: userId}, page, function (err, posts, total) {
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
        return next(err);
    });
};

exports.getPostInfo = function (req, res, next) {
    var id = req.body.id;
    Post.findById(id, function (err, post) {
        if (err) {
            console.log(err);
            return next(err);
        }
        res.jsonp(post);
    });
};