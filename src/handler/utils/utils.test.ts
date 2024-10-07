import { createResponse } from './index';

describe('createResponse', () => {
  it('should return a valid APIGatewayProxyResult with JSON content', () => {
    const result = createResponse(200, { message: 'Success' });

    expect(result).toEqual({
      statusCode: 200,
      body: JSON.stringify({ message: 'Success' }),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  });

  it('should return a valid APIGatewayProxyResult with plain text content', () => {
    const result = createResponse(200, 'Plain text response', 'text/plain');

    expect(result).toEqual({
      statusCode: 200,
      body: 'Plain text response',
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  });

  it('should handle different status codes', () => {
    const result = createResponse(404, { message: 'Not Found' });

    expect(result).toEqual({
      statusCode: 404,
      body: JSON.stringify({ message: 'Not Found' }),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  });
});