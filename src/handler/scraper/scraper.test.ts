import chromium from '@sparticuz/chromium';
import puppeteer, { Browser, Page } from 'puppeteer-core';
import { getBrowser, getPage } from './index'; // Adjust the import path as necessary
import { Logger } from '../logger';
import { RequestBody, ReturnType } from '../schema';
import { ABORTED_RESOURCES } from '../../constants';

jest.mock('@sparticuz/chromium');
jest.mock('puppeteer-core');
jest.mock('../logger');

describe('getBrowser', () => {
  it('should launch puppeteer with correct arguments', async () => {
    const executablePath = '/path/to/chromium';
    (chromium.executablePath as jest.Mock).mockResolvedValue(executablePath);
    const browserMock = {};
    (puppeteer.launch as jest.Mock).mockResolvedValue(browserMock);

    const browser = await getBrowser();

    expect(chromium.executablePath).toHaveBeenCalled();
    expect(Logger.info).toHaveBeenCalledWith(`Chromium executable path ${executablePath}`);
    expect(puppeteer.launch).toHaveBeenCalledWith({
      args: chromium.args,
      executablePath,
      headless: true,
      defaultViewport: chromium.defaultViewport,
    });
    expect(browser).toBe(browserMock);
  });
});

describe('getPage', () => {
  let browserMock: Partial<Browser>;
  let pageMock: Partial<Page>;
  let requestBody: RequestBody;

  beforeEach(() => {
    pageMock = {
      setRequestInterception: jest.fn(),
      on: jest.fn(),
      setCookie: jest.fn(),
      goto: jest.fn(),
      waitForNavigation: jest.fn(),
    };

    browserMock = {
      newPage: jest.fn().mockResolvedValue(pageMock),
    };

    requestBody = {
      url: 'https://example.com',
      cookies: [],
      timeoutMs: 5000,
      returnType: ReturnType.HTML
    };
  });

  it('should throw error when browser is invalid', async () => {
    await expect(getPage(null as unknown as Browser, requestBody)).rejects.toThrow('Invalid browser instance');
  });

  it('should navigate to the given URL and return the page', async () => {
    await getPage(browserMock as Browser, requestBody);

    expect(browserMock.newPage).toHaveBeenCalled();
    expect(pageMock.setRequestInterception).toHaveBeenCalledWith(true);
    expect(pageMock.on).toHaveBeenCalledWith('request', expect.any(Function));
    expect(pageMock.goto).toHaveBeenCalledWith('https://example.com');
    expect(Logger.info).toHaveBeenCalledWith(`Navigating to URL: ${requestBody.url}`);
    expect(pageMock.waitForNavigation).toHaveBeenCalledWith({ waitUntil: 'networkidle0' });
    expect(pageMock.waitForNavigation).toHaveBeenCalledWith({ waitUntil: 'networkidle2' });
    expect(Logger.info).toHaveBeenCalledWith('Page loaded or timeout reached');
  });

  it('should set cookies when provided', async () => {
    requestBody.cookies = [{ name: 'test', value: 'value', domain: 'example.com' }];

    await getPage(browserMock as Browser, requestBody);

    expect(pageMock.setCookie).toHaveBeenCalledWith(...requestBody.cookies);
  });

  it('should handle request interception and abort or continue requests based on resource type', async () => {
    let requestHandler: any;
    pageMock.on = jest.fn().mockImplementation((event, handler) => {
      if (event === 'request') {
        requestHandler = handler;
      }
    });

    await getPage(browserMock as Browser, requestBody);

    const reqMock = {
      resourceType: jest.fn().mockReturnValue('image'),
      url: jest.fn().mockReturnValue('https://example.com/image.png'),
      abort: jest.fn(),
      continue: jest.fn(),
    };

    await requestHandler(reqMock);

    if (ABORTED_RESOURCES.includes('image')) {
      expect(Logger.debug).toHaveBeenCalledWith(`Aborted request: https://example.com/image.png of type: image`);
      expect(reqMock.abort).toHaveBeenCalled();
      expect(reqMock.continue).not.toHaveBeenCalled();
    } else {
      expect(Logger.debug).toHaveBeenCalledWith(`Allowed request: https://example.com/image.png of type: image`);
      expect(reqMock.continue).toHaveBeenCalled();
      expect(reqMock.abort).not.toHaveBeenCalled();
    }
  });

  it('should wait for navigation or timeout', async () => {
    jest.useFakeTimers();

    pageMock.waitForNavigation = jest
      .fn()
      .mockReturnValueOnce(new Promise((resolve) => setTimeout(resolve, 1000)))
      .mockReturnValueOnce(new Promise((resolve) => setTimeout(resolve, 2000)));

    const getPagePromise = getPage(browserMock as Browser, requestBody);

    jest.advanceTimersByTime(requestBody.timeoutMs as number);

    await getPagePromise;

    expect(pageMock.waitForNavigation).toHaveBeenCalledWith({ waitUntil: 'networkidle0' });
    expect(pageMock.waitForNavigation).toHaveBeenCalledWith({ waitUntil: 'networkidle2' });

    jest.useRealTimers();
  });
});