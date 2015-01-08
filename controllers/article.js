var config = require('../config'),
    Post = require('../models').Post,
    User = require('../models').User,
    Tag = require('../models').Tag,
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
                tagId: postObj.tag,
                readNum: 0
            });
            _post.save(function (err) {
                if (err) {
                    console.log(err);
                    return next(err);
                }
                Tag.updatePostNum(postObj.tag, 'add', function (err, tag) {
                	if (err) {
                		console.log(err);
                		return next(err);
                	}
                	req.flash('success', '发表成功');
                	return res.redirect('/post');
                });
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
                            user: req.session.user,
                            moment: moment
                        });
                    }
                });
            } else {
                res.render('details', {
                    title: 'Details',
                    tips: '',
                    post: {},
                    user: req.session.user,
                    moment: moment
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
    Post.remove({_id: req.body.id, authorId: req.session.user.userId}, function (err, result) {
        if (err) {
            console.log(err);
            return next(err);
        }
        if (result) {
        	// 更新标签文章数
        	Tag.updatePostNum(result.tagId, '', function (err, tag) {
        		if (err) {
        			console.log(err);
        			return next(err);
        		}
        		res.end('删除成功');
        	});
        }else {
            res.end('删除失败');
        }
    });
};

exports.savePost = function (req, res, next) {
    var id = req.body.id,
        title = req.body.title,
        content = req.body.content;
    Post.findOneByCondition({_id: id, authorId: req.session.user.userId}, function (err, oldPost) {
        if (err) {
            console.log(err);
            return next(err);
        }
        if (oldPost) {
            Post.update({_id: id, authorId: req.session.user.userId}, {title: title, content: content, tagId:req.body.tag, updateAt: Date.now()}, function(err, newPost) {
                if (err) {
                    console.log(err);
                    res.end('修改失败');
                    return next(err);
                }
                if (newPost) {
                    if (oldPost.tagId && oldPost.tagId !== req.body.tag) {
                        Tag.updatePostNum(req.body.tag, 'add', function (err, tag) {
                            if (err) {
                                console.log(err);
                                return next(err);
                            }
                        });
                        Tag.updatePostNum(oldPost.tagId, '', function (err, tag) {
                            if (err) {
                                console.log(err);
                                return next(err);
                            }
                        });
                    }
                    res.end('修改成功');
                } else {
                    res.end('修改失败');
                }
            });
        } else {
            res.end('不存在此文章！');
        }
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
        Post.findByConditionAndPage({authorId: userId}, page, function (err, posts, total) {
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
            mo.updateAt = moment(mo.updateAt).format('YYYY-MM-DD-hh:mm:ss');
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

// 增加文章标签
exports.addTag = function (req, res, next) {
	var name = req.body.name;
	if (validator.trim(name) === '') {
		return res.end('-1');
	}
	var tag = new Tag({
            name: name,
            postNum: 0
        });
    tag.save(function (err) {
        if (err) {
            console.log(err);
            res.end('0')
            return next(err);
        }
        res.end('1');
    });
};

// 获取文章标签
exports.getTags = function (req, res, next) {
	Tag.fetch(function (err, tags) {
		if (err) {
			console.log(err);
			res.end('0');
			return next(err);
		}
		tags = tags.map(function (tag, id) {
			return tag.toObject();
		});
		res.end(JSON.stringify(tags));
	});
};

// 按标签获取文章
exports.getPostInTag = function (req, res, next) {
    var page = req.query.p ? parseInt(req.query.p, 10) : 1;
	Post.postsPage(page, {tagId: req.query.tag}, function (err, data, total) {
        if (err) {
            console.log(err);
            return next(err);
        }
        res.render('tagArchives', {
            title: 'tagArchives',
            tips: req.flash('success').toString() || req.flash('error').toString() || '',
            posts: data,
            user: req.session.user,
            page: page,
            moment: moment,
            isLastPage: page*2 >= total ? '1' : '',
            isFirstPage: (total === 0) || (page === 1) ? '1' : ''
        });
    });
};