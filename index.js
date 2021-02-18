const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// const BASE_URL = 'http://localhost:8080/';
const BASE_URL = 'https://vega-gapminder.caleydoapp.org/';
const SESSION_PATH = './sessions';
const SCREENSHOT_PATH = './screenshots';

function start(baseURL, sessionPath, screenshotPath) {
    async function captureScreenshotFromSession(sessionFile) {
        console.log('launch browser');
        const browser = await puppeteer.launch();

        console.log('open new page');
        const page = await browser.newPage();

        await page.setViewport({
            width: 1920,
            height: 1080,
            deviceScaleFactor: 1,
        });

        await page.goto(baseURL, {
            waitUntil: 'networkidle2',
        });
        console.log('initial url', page.url());

        // accept cookies to hide cookie bar
        console.log('accept cookies to hide cookie bar');
        await page.waitForSelector('#cookie-bar-button');
        await (await page.$('#cookie-bar-button')).click();
        await page.waitForSelector('#cookie-bar-button', { hidden: true }); // wait until hide animation finishes

        console.log('open session dropdown');
        await (await page.$('body > div.box > nav > div.collapse.navbar-collapse > ul:nth-child(4) > li > a')).click();

        console.log('import session locally');
        await (await page.$('#provenancegraph_import')).click();

        await page.waitForSelector('input[type=file]'); // wait for upload modal dialog to open

        const inputUploadHandle = await page.$('input[type=file]');
        console.log('select the session file to upload');
        await Promise.all([
            inputUploadHandle.uploadFile(sessionFile),
            page.waitForNavigation({
                waitUntil: 'networkidle2', // wait again until page has loaded
            })
        ]);
        const sessionUrl = page.url();
        console.log('new session url', sessionUrl);

        await page.waitForSelector('main'); // wait for the selector which indicates the page initialization has finished
        await page.waitForSelector('svg.marks'); // wait until vega svg has loaded

        const sessionPath = path.join(screenshotPath, path.basename(sessionFile));

        // create directory for this session
        if (!fs.existsSync(sessionPath)) {
            console.log('create new directory for session screenshots', sessionPath);
            fs.mkdirSync(sessionPath);
        }

        function extractStateIdsFromSession(sessionFile) {
            const session = JSON.parse(fs.readFileSync(sessionFile, 'utf8'));
            const states = session.nodes.filter((node) => node.type === 'state');
            return states.map((state) => state.id);
        }

        console.log('extract state ids from session');
        const stateIds = extractStateIdsFromSession(sessionFile);
        console.log('number of states', stateIds.length);

        for (let i = 0; i < stateIds.length; i++) {
            const sessionStateURL = `${sessionUrl}&clue_state=${stateIds[i]}`;
            const sessionScreenshotPath = path.join(sessionPath, `${stateIds[i]}.png`);

            await page.goto(sessionStateURL, {
                // waitUntil: 'networkidle2', // no need to wait again since everything is already loaded
            });

            console.log(`take screenshot of`, sessionStateURL);
            const mainElement = await page.$('main'); // select main element
            await mainElement.screenshot({ path: sessionScreenshotPath }); // take screenshot element in puppeteer
            console.log(`screenshot saved to ${sessionScreenshotPath}`);
        }

        console.log('close browser');
        await browser.close();
    }

    fs.readdir(sessionPath, async (err, files) => {
        if (err) {
            throw err;
        }

        files = files.filter((file) => path.extname(file) === '.json');

        for (let i = 0; i < files.length; i++) {
            console.log(`start session ${files[i]}`);
            await captureScreenshotFromSession(path.join(SESSION_PATH, files[i]));
            console.log(`finished session ${files[i]}`);
            console.log('----------------------------------------------');
        }
        console.log('All done!');
    });
}

start(BASE_URL, SESSION_PATH, SCREENSHOT_PATH);
