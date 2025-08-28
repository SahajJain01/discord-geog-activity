import { PrismaClient } from '@prisma/client';
import { logger } from '../services/logger.js';

export const prisma = new PrismaClient({
  log: [
    { level: 'warn', emit: 'event' },
    { level: 'error', emit: 'event' },
  ],
});

prisma.$on('warn', (e) => logger.warn(e));
prisma.$on('error', (e) => logger.error(e));

