import winston from 'winston';

const { combine, timestamp, errors, json, colorize, simple } = winston.format;

const transports = [
  new winston.transports.Console({
    format: process.env.NODE_ENV === 'production'
      ? combine(timestamp(), errors({ stack: true }), json())
      : combine(colorize(), simple()),
  }),
];

if (process.env.NODE_ENV === 'production') {
  transports.push(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: combine(timestamp(), errors({ stack: true }), json()),
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: combine(timestamp(), json()),
    })
  );
}

export const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: combine(timestamp(), errors({ stack: true }), json()),
  transports,
  exitOnError: false,
});
