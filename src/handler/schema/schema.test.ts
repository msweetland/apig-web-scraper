import * as Joi from 'joi';
import { schema, ReturnType } from './index'; // update path accordingly
import { DEFAULT_TIMEOUT_MS, MAX_TIMEOUT_MS } from '../../constants'; // update path accordingly

describe('Joi schema validation', () => {
  const validRequestBody = {
    url: 'https://example.com',
    cookies: [
      {
        name: 'session',
        value: '123456',
        domain: 'example.com',
      },
    ],
    returnType: ReturnType.HTML,
    timeoutMs: MAX_TIMEOUT_MS - 1,
  };

  it('should validate a valid request body', () => {
    const { error } = schema.validate(validRequestBody);
    expect(error).toBeUndefined();
  });

  it('should fail if url is not a valid URI', () => {
    const invalidBody = {
      ...validRequestBody,
      url: 'invalid-url',
    };
    const { error } = schema.validate(invalidBody);
    expect(error).toBeDefined();
    expect(error?.details[0].message).toContain('"url" must be a valid uri');
  });

  it('should pass if cookies array is empty', () => {
    const invalidBody = {
      ...validRequestBody,
      cookies: [],
    };
    const { error } = schema.validate(invalidBody);
    expect(error).toBeUndefined();
  });

  it('should pass if cookies array is undefined', () => {
    const invalidBody = {
      ...validRequestBody,
      cookies: undefined,
    };
    const { value, error } = schema.validate(invalidBody);
    expect(error).toBeUndefined();
    expect(value.cookies).toEqual([])
  });

  it('should fail if cookie object is missing a required field', () => {
    const invalidBody = {
      ...validRequestBody,
      cookies: [
        {
          name: 'session',
          // missing 'value' field
          domain: 'example.com',
        },
      ],
    };
    const { error } = schema.validate(invalidBody);
    expect(error).toBeDefined();
    expect(error?.details[0].message).toContain('value" is required');
  });

  it('should validate when timeoutMs is optional', () => {
    const { value, error } = schema.validate({
      ...validRequestBody,
      timeoutMs: undefined,
    });
    expect(error).toBeUndefined();
    expect(value.timeoutMs).toEqual(DEFAULT_TIMEOUT_MS)
  });

  it('should fail if timeoutMs exceeds MAX_TIMEOUT_MS', () => {
    const invalidBody = {
      ...validRequestBody,
      timeoutMs: MAX_TIMEOUT_MS + 1,
    };
    const { error } = schema.validate(invalidBody);
    expect(error).toBeDefined();
    expect(error?.details[0].message).toContain(`"timeoutMs" must be less than or equal to ${MAX_TIMEOUT_MS}`);
  });

  it('should fail if returnType is invalid', () => {
    const invalidBody = {
      ...validRequestBody,
      returnType: 'InvalidType', // invalid return type
    };
    const { error } = schema.validate(invalidBody);
    expect(error).toBeDefined();
    expect(error?.details[0].message).toContain('"returnType" must be one of [HTML, InnerText]');
  });

  it('should validate without the optional timeoutMs field', () => {
    const bodyWithoutTimeout = { ...validRequestBody , timeoutMs: undefined };
    const { error } = schema.validate(bodyWithoutTimeout);
    expect(error).toBeUndefined();
  });

  it('should fail if cookies have invalid domain', () => {
    const invalidBody = {
      ...validRequestBody,
      cookies: [
        {
          name: 'session',
          value: '123456',
          domain: '', // empty domain
        },
      ],
    };
    const { error } = schema.validate(invalidBody);
    expect(error).toBeDefined();
    expect(error?.details[0].message).toContain('domain" is not allowed to be empty');
  });
});