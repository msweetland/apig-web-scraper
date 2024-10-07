
import { APIGatewayProxyResult } from 'aws-lambda';

export const createResponse = (statusCode: number, body: string | object, contentType: string = 'application/json'): APIGatewayProxyResult => {
  return {
    statusCode,
    body: typeof body === 'string' ? body : JSON.stringify(body),
    headers: {
      'Content-Type': contentType,
    },
  };
};