import * as Joi from 'joi';
import { RequestBody, ReturnType } from './types';

export const schema = Joi.object<RequestBody>({
  url: Joi.string().uri().required(),
  cookies: Joi.array()
    .items(
      Joi.object({
        name: Joi.string().required(),
        value: Joi.string().required(),
        domain: Joi.string().required(),
      })
    )
    .required(),
  returnType: Joi.string().valid(...Object.values(ReturnType)),
  timeoutMs: Joi.number().positive().max(20000).optional()
});