import chromium from '@sparticuz/chromium';
import puppeteer, { Browser, Page } from 'puppeteer-core';
import { RequestBody } from '../schema';
import { Logger } from '../logger';
import { ABORTED_RESOURCES, DEFAULT_TIMEOUT_MS } from "../../constants";

export const getBrowser = async (): Promise<Browser> => {
  const executablePath = await chromium.executablePath();
  Logger.info(`Chromium executable path ${executablePath}`);
  return puppeteer.launch({
    args: chromium.args,
    executablePath,
    headless: true,
    defaultViewport: chromium.defaultViewport,
  });
};


export const getPage = async (browser: Browser, { url, cookies, timeoutMs }: RequestBody): Promise<Page> => {
  if (!browser) {
    throw new Error('Invalid browser instance');
  }

  const page = await browser.newPage();
  await page.setRequestInterception(true);
  filterRequests(page);

  if (cookies && cookies.length > 0) {
    await page.setCookie(...cookies);
  }

  await page.goto(url);
  Logger.info(`Navigating to URL: ${url}`);

  await Promise.race([
    page.waitForNavigation({ waitUntil: 'networkidle0' }),
    page.waitForNavigation({ waitUntil: 'networkidle2' }),
    new Promise((resolve) => setTimeout(resolve, timeoutMs || DEFAULT_TIMEOUT_MS)),
  ]);

  Logger.info('Page loaded or timeout reached');
  return page;
};


const filterRequests = (page: Page) => {
  page.on('request', (req) => {
    const resourceType = req.resourceType();
    if (ABORTED_RESOURCES.includes(resourceType)) {
      Logger.debug(`Aborted request: ${req.url()} of type: ${resourceType}`);
      req.abort();
    } else {
      Logger.debug(`Allowed request: ${req.url()} of type: ${resourceType}`);
      req.continue();
    }
  });
};