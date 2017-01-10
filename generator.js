var Nightmare = require('nightmare');
var nightmare = Nightmare({
    show: true
    , webPreferences: {
        webSecurity: false,
    },
    show: true,
    typeInterval: 20,
    alwaysOnTop: false,
    waitTimeout: 60 * 1000
    });
var fs = require('fs')
var authData = JSON.parse(fs.readFileSync("./auth.json"));
var iframe = require('nightmare-iframe-manager')(Nightmare);
nightmare
    .viewport(1200, 900)
    .goto('https://byui.brightspace.com/d2l/login?noredirect=true')
    .wait('#password').insert('#userName', authData.username)
    .insert('#password', authData.password)
    //    .evaluate(function () {
    //    return document.querySelector('#zero_click_wrapper .c-info__title a').href;
    //    })
    .click('#formId div a') //login
    .wait(2500)
    .wait('#d2l_lp_minibar_courseselector > a')
    .goto('https://byui.brightspace.com/d2l/le/manageCourses/search/6606')
    .click('#AdvancedSearch div > div:nth-child(1) div div div > div:nth-child(1) div div a') //click select semester
    .wait(5000)
    .enterIFrame('iframe')
    .wait('.d2l-searchsimple-input')
//Type Semester
    .type('.d2l-searchsimple-input', 'winter 2017')
    .click('.d2l-searchsimple-search-link')
    .wait(function(){
    return document.querySelector('.d2l-datalist-item-content .d2l-label').innerText.match('Winter 2017') !== null
    })
    .check('input[type="radio"]')
    .click('.vui-button-primary')
    .exitIFrame()
    .select('.d2l-grid-footer-wrapper select', '100')
    .wait(5000)
//type query
    .insert('.d2l-searchsimple-input', 'online')
    .click('.d2l-searchsimple-search-link')
    .wait(2000)
    .evaluate(function(){
        var nodes = document.querySelectorAll('tbody tr a.vui-link')
        var links = []
        for (var i=0; i<nodes.length; i++) {
            links[i] = nodes[i].getAttribute('href')
        }
        return links
    })

//click the next page
    //.click('a[aria-label="Next Page"]')
/*    .evaluate(function(){
        var nodes = document.querySelectorAll('tbody tr a.vui-link')
        for (var i=0; i<nodes.length; i++) {
            links[i] = nodes[i].getAttribute('href')
        }
        return links
    })*/
    .end()
    .then(function (result) {
        console.log(result);
    }).catch(function (error) {
        console.error('Failed:', error);
    });