var config = {
	name: 'MyBlog', // 博客名
	host: 'localhost:3000', // 博客地址
    dbName: 'myblog', // 数据库名称

    // db
    dbName: 'myblog', // 数据库名称

    // session
    sessionStr: 'dsalkfjsdklfjdksjflkajlkdsjnvcxdhfewewuie', // 建议使用 128 个字符的随机字符串
    maxAge: 60 * 60 * 60 * 10000,

    //auth
    // github
    clientID: 'your clientID',
    clientSecret: 'your clientSecret',
    callbackURL: 'your callbackURL',

    // smtp
	session_secret: 'glowrypaukyBlog' // 邮箱验证时加入的随机字符串
    mailUser: 'youmail@mail.com', // 邮箱账号
    mailPassword: 'your password' // 邮箱密码
};

module.exports = config;