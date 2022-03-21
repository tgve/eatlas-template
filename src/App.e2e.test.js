import puppeteer from 'puppeteer'
import url from 'url'
import fs from 'fs'
import { toMatchImageSnapshot } from 'jest-image-snapshot'

export function setConfig() {
    return {
        failureThreshold: '0.5',
        failureThresholdType: 'percent',
        customSnapshotsDir: `${__dirname}/__snapshots__/`,
        customSnapshotIdentifier: expect.getState().currentTestName.replace(/\s+/g, '-'),
        noColors: true
    }
}

async function waitForElementText(text,selector) {
    return page.waitForFunction(
        (selector, text) => {
            const e = document.querySelector(selector)
            return e && e.textContent == text
        },
        {timeout:30000},
        selector,
        text
    );
}

async function screenshot() {
    await page.$eval('.mapboxgl-map',e => e.setAttribute("style", "visibility: hidden"));
    await page.$eval('.loader',e => e.setAttribute("style", "visibility: hidden"));
    return page.screenshot({ fullPage: true });
}



let browser;
let page;

beforeAll(async () => {
    browser = await puppeteer.launch();
    page = await browser.newPage();
    expect.extend({ toMatchImageSnapshot });
});

describe("App.js", () => {
    if(!fs.existsSync("build")) {
        fail("No build found; 'yarn build-local' first")
    }

    it("no url includes Nothing to show", async () => {
        await page.goto(url.pathToFileURL("build/index.html"));
        return waitForElementText("Nothing to show",'.side-pane-header > h2')
    });

    it("contains 100 rows", async () => {
        await page.goto(url.pathToFileURL("build/index.html")
            + "?defaultURL=https://raw.githubusercontent.com/tgve/example-data/main/casualties_100.geojson");
        return waitForElementText("100 rows",'.side-pane-header > h2')
    });

    it("wrong url includes Nothing to show", async () => {
        await page.goto(url.pathToFileURL("build/index.html")
            + "?defaultURL=https://wrongurl.fail");
        return waitForElementText("Nothing to show",'.side-pane-header > h2')
    });

    it("check screenshot", async () => {
        await page.goto(url.pathToFileURL("build/index.html"));
        await page.setViewport({ width: 600, height: 1000 });
        await waitForElementText("Nothing to show",'.side-pane-header > h2')
        const image = await screenshot();
        expect(image).toMatchImageSnapshot(setConfig());
    });

    it("check screenshot with data uploaded", async () => {
        await page.goto(url.pathToFileURL("build/index.html")
        + "?defaultURL=https://raw.githubusercontent.com/tgve/example-data/main/casualties_100.geojson");
        await page.setViewport({ width: 800, height: 1400 });
        await waitForElementText("100 rows",'.side-pane-header > h2')
        const image = await screenshot();
        expect(image).toMatchImageSnapshot(setConfig());
    });

})


afterAll(async () => browser.close());
