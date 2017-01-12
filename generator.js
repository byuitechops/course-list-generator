/* eslint-env browser, node */
/* eslint no-console:0 */

/****           Use These Variables for your search              ****/
/**** for semester use the semester you are targeting, capitalized  */
/**** for query, enter your search query for the semester           */

var semester = "Winter 2017"
var query = "online"


var Nightmare = require('nightmare');
require('nightmare-helpers')(Nightmare);
require('nightmare-iframe-manager')(Nightmare);

var fs = require('fs')
var dsv = require('d3-dsv')
var nightmare = Nightmare({
    show: true
    , webPreferences: {
        webSecurity: false,
    },
    typeInterval: 20,
    alwaysOnTop: false,
    waitTimeout: 100 * 1000
    });
var authData = JSON.parse(fs.readFileSync("./auth.json"));
var links = []
var i = 1;

function scrapePage(nightmare){
    //scrape the page, and log the result
    nightmare
    .evaluate(function(){
        var tempLinks = []
        var nodes = document.querySelectorAll('tbody tr a.vui-link')
        for (var i=0; i<nodes.length; i++) {
            tempLinks.push({link: nodes[i].getAttribute('href'),
                       name: nodes[i].innerHTML})
        }
        var isLastPage
        var nextButton = document.querySelector('a[title="Next Page"]')
        if(nextButton.getAttribute('aria-disabled') == 'true'){
            isLastPage = true
        }
        var currPage = document.querySelector('tbody tr:nth-child(1) th a').innerText;
        return {tempLinks: tempLinks, isLastPage: isLastPage, currPage: currPage}
    })
    .then(function(obj){
        links = links.concat(obj.tempLinks)
        console.log("scraped page " + i)
        i++
        if(obj.isLastPage){
            done(nightmare);
            return
        } else {
            goToNextPage(nightmare, obj.currPage)
        }
    }).catch(function (error) {
        console.error('Failed:', error);
    });
}

function goToNextPage(nightmare, currPage){
    //go to the next page, and then analyze it
    nightmare
    .click('a[title="Next Page"]')
    .wait(function(currPage){
        return document.querySelector('tbody tr:nth-child(1) th a').innerText != currPage
    }, currPage)
    .then(function(){
        scrapePage(nightmare)
    })
}

function done(nightmare){
    //close the view, and save the file
    nightmare
    .end()
    .then(function(){
        console.log('Process Complete!')
        var coursesCSV = (dsv.csvFormat(links))
        fs.writeFileSync('ols.csv', coursesCSV)
        console.log('File Written to ols.csv')
    }).catch(function (error) {
        console.error('Failed:', error);
    });
}

function clearFilter(nightmare){
    nightmare
    .click("a[title='Clear " + semester + " Semester filter']")
    .wait(".d2l-page-message-container:last-of-type .d2l-page-message:not(.d2l-hidden)")
    .wait(1000)
    .then(function(){
        contNightmare(nightmare)
    })
}

function contNightmare(nightmare){
    nightmare
    .click('#AdvancedSearch div > div:nth-child(1) div div div > div:nth-child(1) div div a')
    .wait('iframe')
    .enterIFrame('iframe')
    .wait('.d2l-searchsimple-input')
//Type Semester
    .type('.d2l-searchsimple-input', semester)
    .click('.d2l-searchsimple-search-link')
//Wait for semester to appear
    .wait(function(semester){
    return document.querySelector('.d2l-datalist-item-content .d2l-label').innerText.match(semester) !== null
    }, semester)
    .check('input[type="radio"]')
    .click('.vui-button-primary')
    .exitIFrame()
    .wait(".d2l-page-message-container:last-of-type .d2l-page-message:not(.d2l-hidden)")
//type query
    .insert('.d2l-searchsimple-input', query)
    .click('.d2l-searchsimple-search-link')
    .wait(".d2l-page-message-container:last-of-type .d2l-page-message:not(.d2l-hidden)")
    .select('.d2l-grid-footer-wrapper select', '100')
    .wait(".d2l-page-message-container:last-of-type .d2l-page-message:not(.d2l-hidden)")
    .wait(5000)
    .then(function(){
        console.log('Navigation Successful, scraping started')
        scrapePage(nightmare)
    })
    .catch(function (error) {
        console.error('Failed:', error);
    });
    
    }

nightmare
    .viewport(1200, 900)
    .goto('https://byui.brightspace.com/d2l/login?noredirect=true')
    .wait('#password').insert('#userName', authData.username)
    .insert('#password', authData.password)
//Click login
    .click('#formId div a')
    .waitURL('/d2l/home')
    .goto('https://byui.brightspace.com/d2l/le/manageCourses/search/6606')
    .evaluate(function(semester){
        var isFilter
        if(document.querySelector("div[title='" + semester + "']") !== null){
            isFilter = true
        } else {
            isFilter = false
        }
            return isFilter
    }, semester)
    .then(function(isFilter){
        if(isFilter){
            clearFilter(nightmare)
        } else {
            contNightmare(nightmare)
        }
    })

