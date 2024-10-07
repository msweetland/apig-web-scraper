import { createLogger, format, transports } from 'winston';

const logFormat = format.printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}] : ${stack || message}`;
});

export const Logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    format.colorize(),
    logFormat
  ),
  transports: [
    new transports.Console(),
  ],
  exceptionHandlers: [
    new transports.Console(),
  ]
});