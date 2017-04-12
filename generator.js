/* eslint-env browser, node */
/* eslint no-console:0 */

/****           Use These Variables for your search              ****/
/**** for semester use the semester you are targeting, capitalized  */
/**** for query, enter your search query for the semester           */

/*var semester = process.argv[2]
var query = process.argv[3]

if(semester == null || query == null){
    console.log('To run the generator, call the program with the semester and search query like this: course-list-generator "Winter 2017" "online"')
    return
}*/

var Nightmare = require('nightmare');
require('nightmare-helpers')(Nightmare);
require('nightmare-iframe-manager')(Nightmare);
var prompt = require('prompt')
var properties = [
    {
        name: 'domain',
        message: "Which domain? Type 'p' for Pathway and anything else for BYUI"
    },
    {
        name: 'username',
        required: true
    },
    {
        name: 'password',
        hidden: true,
        replace: '*',
        required: true
    },
    {
        name: 'semester',
        message: 'Type in the semester in this format: Winter 2017'
    },
    {
        name: 'searchQuery',
        message: 'Type your search query'
    }
  ];
var fs = require('fs')
var dsv = require('d3-dsv')
var nightmare = Nightmare({
    show: true,
    webPreferences: {
        webSecurity: false,
    },
    typeInterval: 20,
    alwaysOnTop: false,
    waitTimeout: 100 * 1000
});
var promptData = {}
var domainOptions = ["https://byui.brightspace.com", "https://pathway.brightspace.com"];
var urlPrefix = domainOptions[0];
var links = []
var i = 1;
var semester, query;

function scrapePage(nightmare) {
    //scrape the page, and log the result
    nightmare
        .evaluate(function (urlPrefix) {
            var tempLinks = []
            var nodes = document.querySelectorAll('tbody tr a.vui-link')
            for (var i = 0; i < nodes.length; i++) {
                var href = nodes[i].getAttribute('href');
                tempLinks.push({
                    //just the number
                    ou: href.match(/home\/(\d+)/)[1],
                    //the whole link for editing and incase of leading 0 that excel will drop
                    link: urlPrefix + href,
                    name: nodes[i].innerHTML
                })
            }
            var isLastPage
            var nextButton = document.querySelector('a[title="Next Page"]')
            if (nextButton.getAttribute('aria-disabled') == 'true') {
                isLastPage = true
            }
            var currPage = document.querySelector('tbody tr:nth-child(1) th a').innerText;
            return {
                tempLinks: tempLinks,
                isLastPage: isLastPage,
                currPage: currPage
            }
        }, urlPrefix)
        .then(function (obj) {
            links = links.concat(obj.tempLinks)
            console.log("scraped page " + i)
            i++
            if (obj.isLastPage) {
                done(nightmare);
                return
            } else {
                goToNextPage(nightmare, obj.currPage)
            }
        }).catch(function (error) {
            console.error('Failed:', error);
        });
}

function goToNextPage(nightmare, currPage) {
    //go to the next page, and then analyze it
    nightmare
        .click('a[title="Next Page"]')
        .wait(function (currPage) {
            return document.querySelector('tbody tr:nth-child(1) th a').innerText != currPage
        }, currPage)
        .then(function () {
            scrapePage(nightmare)
        })
}

function getFreeFileName() {
    function getI(i) {
        return i > 0 ? i : '';
    }

    var fs = require('fs'),
        name = 'ols',
        end = '.csv',
        i = 0,
        gotOne = false,
        fullname;




    while (!gotOne) {
        try {
            fullname = name + getI(i) + end;
            fs.accessSync(fullname, fs.constants.F_OK);
            //if we make it to here then the file exist try again
            i += 1;
        } catch (e) {
            //the file does not exist yeah!
            gotOne = true;
        }
    }

    return fullname;
}

function done(nightmare) {
    //close the view, and save the file
    nightmare
        .end()
        .then(function () {
            console.log('Process Complete!')
            var coursesCSV = (dsv.csvFormat(links)),
                fileName = getFreeFileName();

            fs.writeFileSync(fileName, coursesCSV)
            console.log('File Written to ' + fileName);
        }).catch(function (error) {
            console.error('Failed:', error);
        });
}

function clearFilter(nightmare) {
    nightmare
        .click("a[title='Clear " + semester + " Semester filter']")
        .wait(".d2l-page-message-container:last-of-type .d2l-page-message:not(.d2l-hidden)")
        .wait(1000)
        .then(function () {
            contNightmare(nightmare)
        })
}

function contNightmare(nightmare) {
    nightmare
        .click('#AdvancedSearch div > div:nth-child(1) div div div > div:nth-child(1) div div a')
        .wait('iframe')
        .enterIFrame('iframe')
        .wait('.d2l-searchsimple-input')
        //Type Semester
        .type('.d2l-searchsimple-input', semester)
        .click('.d2l-searchsimple-search-link')
        //Wait for semester to appear
        .wait(function (semester) {
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
        .then(function () {
            console.log('Navigation Successful, scraping started')
            scrapePage(nightmare)
        })
        .catch(function (error) {
            console.error('Failed:', error);
        });

}

function startNightmare(nightmare) {
    nightmare
        .viewport(1200, 900)
        .goto(urlPrefix + '/d2l/login?noredirect=true')
        .wait('#password').insert('#userName', promptData.username)
        .insert('#password', promptData.password)
        //Click login
        .click('#formId div a')
        .waitURL('/d2l/home')
        .goto(urlPrefix + '/d2l/le/manageCourses/search/6606')
        .evaluate(function (semester) {
            var isFilter
            if (document.querySelector("div[title='" + semester + "']") !== null) {
                isFilter = true
            } else {
                isFilter = false
            }
            return isFilter
        }, semester)
        .then(function (isFilter) {
            if (isFilter) {
                clearFilter(nightmare)
            } else {
                contNightmare(nightmare)
            }
        })
}

//Get Username and Password for D2l
prompt.start();

prompt.get(properties, function (err, result) {
    if (err) {
        return onErr(err)
    }
    promptData = {
        username: result.username,
        password: result.password
    }
    if (result.domain.toLowerCase() === 'p') {
        urlPrefix = domainOptions[1];
    }
    semester = result.semester
    query = result.searchQuery
    console.log('Thanks, logging in')
    startNightmare(nightmare)
})

function onErr(err) {
    console.log(err);
    return 1;
}
