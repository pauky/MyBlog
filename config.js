var config = {
    // base
    name: 'MyBlog', // 博客名

    // web
    host: 'localhost:3000', // 博客地址
    port: 3000, // web服务器端口

    // debug
    debug: true, // true: 开启开放调试模式  false: 开启线上模式

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
    session_secret: 'glowrypaukyBlog' // 邮箱验证时加入的字符串
    mailUser: 'youmail@sina.com', // 邮箱账号
    mailPassword: 'youpassword' // 邮箱密码

};

module.exports = config;