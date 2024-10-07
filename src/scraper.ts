import chromium from '@sparticuz/chromium';
import puppeteer, { Browser, Page } from 'puppeteer-core';
import { RequestBody } from './types';

export const getBrowser = async () => await puppeteer.launch({
  args: chromium.args,
  executablePath: await chromium.executablePath(),
  headless: true,
  defaultViewport: chromium.defaultViewport,
});

export const getPage = async (browser: Browser, {url, cookies, timeoutMs}: RequestBody): Promise<Page> => {

  const page = await browser.newPage();
  await page.setRequestInterception(true);
  filterRequests(page);

  // Set cookies if any
  if (cookies && cookies.length > 0) {
    await page.setCookie(...cookies);
  }

  await page.goto(url);
  console.log('Waiting for page to load...');

  await Promise.race([
    page.waitForNavigation({ waitUntil: 'networkidle0' }),
    page.waitForNavigation({ waitUntil: 'networkidle2' }),
    new Promise(resolve => setTimeout(resolve, timeoutMs || 5000))
  ]);

  console.log('Navigation or timeout occurred, returning page.');

  return page
};

const filterRequests = (page: Page) => {
  page.on('request', (req) => {
    const resourceType = req.resourceType();
    if (['ping', 'image', 'stylesheet', 'font'].includes(resourceType)) {
      console.log(`Aborted, Request URL: ${req.url()}`);
      req.abort();
    } else {
      console.log(`Request URL: ${req.url()}, Resource Type: ${resourceType}`);
      req.continue();
    }
  });
}