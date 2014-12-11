$(function () {
    var pageUrl = location.pathname,
        blog_nav_a = $('.blog-nav a');
    switch(true) {
        case /\/post/.test(pageUrl):
            blog_nav_a.eq(1).addClass('active');
            break;
        case /\/about/.test(pageUrl):
            blog_nav_a.eq(2).addClass('active');
            break;
        case (/\//.test(pageUrl)):
            blog_nav_a.eq(0).addClass('active');
            break;
    }

    // usersList
    $('.selectpicker').selectpicker();
});