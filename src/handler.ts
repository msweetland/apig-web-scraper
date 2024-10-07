import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { schema } from './validation';
import { RequestBody, ReturnType } from './types';
import { getBrowser, getPage } from './scraper';
import { Browser } from "puppeteer-core";

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {

  let browser: Browser | undefined;

  try {
    console.log("Received:", event.body);
    const request: RequestBody = JSON.parse(event.body || '{}');

    const {error} = schema.validate(request);
    if (error) {
      return {
        statusCode: 400,
        body: JSON.stringify({message: error.message}),
      };
    }

    console.log("Starting Browser");
    browser = await getBrowser();
    console.log("Fetching Page");
    const page = await getPage(browser, request);

    const {returnType} = request;
    console.log("Extracting content as", returnType);
    const body = returnType == ReturnType.HTML ?
      await page.content() :
      await page.evaluate(() => {
        return document.body.innerText
      })

    return {
      statusCode: 200,
      body,
      headers: {
        'Content-Type': 'text/plain',
      },
    };
  } catch (err: any) {
    console.error('Error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({message: err.body}),
    };
  } finally {
    await browser?.close()
  }
};