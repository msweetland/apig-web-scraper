import * as Joi from 'joi';
import { DEFAULT_TIMEOUT_MS, MAX_TIMEOUT_MS } from '../../constants';

export enum ReturnType {
  HTML = 'HTML',
  InnerText = 'InnerText'
}

export interface Cookie {
  name: string;
  value: string;
  domain: string;
}

export interface RequestBody {
  url: string;
  cookies: Array<Cookie>;
  returnType: ReturnType;
  timeoutMs?: number;
}

const cookieSchema = Joi.object<Cookie>({
  name: Joi.string().required(),
  value: Joi.string().required(),
  domain: Joi.string().required(),
});

export const schema = Joi.object<RequestBody>({
  url: Joi.string().uri().required(),
  cookies: Joi.array().items(cookieSchema).optional().default([]),
  returnType: Joi.string().valid(...Object.values(ReturnType)),
  timeoutMs: Joi.number().positive().max(MAX_TIMEOUT_MS).optional().default(DEFAULT_TIMEOUT_MS),
});