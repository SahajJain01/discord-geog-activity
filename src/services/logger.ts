import pino from 'pino';

export const logger = pino({
  name: 'geog-daily-bot',
  level: process.env.LOG_LEVEL || 'info',
});

