import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { schema, RequestBody, ReturnType } from './schema';
import { getBrowser, getPage } from './scraper';
import { Browser } from "puppeteer-core";
import { Logger } from './logger';
import { createResponse } from "./utils"; // Assuming you have a logger module

export const main = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  let browser: Browser | undefined;

  Logger.info('Received event body:', {body: event.body});
  const request: RequestBody = JSON.parse(event.body || '{}');
  const {error} = schema.validate(request);

  if (error) {
    Logger.warn("Validation error:", {message: error.message});
    return createResponse(400, {message: error.message});
  }

  try {
    Logger.info('Starting browser...');
    browser = await getBrowser();

    Logger.info('Fetching page for URL:', {url: request.url});
    const page = await getPage(browser, request);

    const {returnType} = request;
    Logger.info('Extracting content as', returnType);

    const body = returnType === ReturnType.HTML
      ? await page.content() // Fetch full HTML content
      : await page.evaluate(() => document.body.innerText); // Fetch innerText

    Logger.info('Content extraction successful');
    return createResponse(200, body, 'text/plain');

  } catch (err: any) {
    Logger.error('Error occurred:', {error: err.message});
    return createResponse(500, {message: err.message || 'Internal Server Error'});
  } finally {
    Logger.info('Closing browser');
    browser && await browser.close();
  }
};