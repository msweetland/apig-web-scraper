import { APIGatewayProxyEvent } from "aws-lambda";
import { ReturnType } from './schema';
import { main } from './index';
import { getBrowser, getPage } from './scraper';
import { createResponse } from './utils';
import { Logger } from './logger';

// Mock the dependencies
jest.mock('./scraper');
jest.mock('./utils');
jest.mock('./logger');

const mockGetBrowser = getBrowser as jest.Mock;
const mockGetPage = getPage as jest.Mock;
const mockCreateResponse = createResponse as jest.Mock;
const mockLoggerInfo = Logger.info as jest.Mock;
const mockLoggerWarn = Logger.warn as jest.Mock;
const mockLoggerError = Logger.error as jest.Mock;

describe('Handler Tests', () => {
  let event: APIGatewayProxyEvent;

  beforeEach(() => {
    event = {
      body: JSON.stringify({
        url: 'http://example.com',
        cookies: [],
        returnType: ReturnType.HTML,
        timeoutMs: 3000,
      }),
    } as APIGatewayProxyEvent;

    mockGetBrowser.mockResolvedValue({
      close: jest.fn(),
    });

    mockGetPage.mockResolvedValue({
      content: jest.fn().mockResolvedValue('<html>Content</html>'),
      evaluate: jest.fn(),
    });

    mockCreateResponse.mockImplementation((statusCode, body, contentType) => ({
      statusCode,
      body: JSON.stringify(body),
      headers: {
        'Content-Type': contentType || 'application/json',
      },
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return 200 with HTML content when returnType is HTML', async () => {
    const result = await main(event);

    expect(mockLoggerInfo).toHaveBeenCalledWith('Received event body:', { body: event.body });
    expect(mockGetBrowser).toHaveBeenCalled();
    expect(mockGetPage).toHaveBeenCalled();
    expect(mockCreateResponse).toHaveBeenCalledWith(200, '<html>Content</html>', 'text/plain');
    expect(result).toEqual({
      statusCode: 200,
      body: JSON.stringify('<html>Content</html>'),
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  });

  it('should return 400 if schema validation fails', async () => {
    // Make the request body invalid
    event.body = JSON.stringify({});

    const result = await main(event);

    expect(mockLoggerWarn).toHaveBeenCalledWith('Validation error:', expect.any(Object));
    expect(mockCreateResponse).toHaveBeenCalledWith(400, expect.any(Object));
    expect(result.statusCode).toBe(400);
  });

  it('should return 500 if there is an error in processing', async () => {
    // Simulate an error in `getPage`
    mockGetPage.mockRejectedValue(new Error('Page error'));

    const result = await main(event);

    expect(mockLoggerError).toHaveBeenCalledWith('Error occurred:', { error: 'Page error' });
    expect(mockCreateResponse).toHaveBeenCalledWith(500, { message: 'Page error' });
    expect(result.statusCode).toBe(500);
  });

  it('should close the browser in the finally block', async () => {
    const browserMock = {
      close: jest.fn(),
    };
    mockGetBrowser.mockResolvedValue(browserMock);

    await main(event);

    expect(browserMock.close).toHaveBeenCalled();
  });
});