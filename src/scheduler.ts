import cron from 'node-cron';
import { prisma } from './db/prisma.js';
import { env } from './config.js';
import { logger } from './services/logger.js';
import { Client } from 'discord.js';
import { postDailyFlow } from './services/gameEngine.js';

export async function initScheduler(client: Client) {
  const guilds = await prisma.guildConfig.findMany();
  for (const g of guilds) {
    scheduleForGuild(client, g.guildId, g.dailyChannelId, g.dailyHourLocal, g.tz);
  }
}

export function scheduleForGuild(
  client: Client,
  guildId: string,
  channelId: string,
  hourLocal: number,
  tz: string,
) {
  // Cron: run at minute 0 of given hour in tz
  const expr = `0 ${hourLocal} * * *`;
  const task = cron.schedule(
    expr,
    async () => {
      try {
        await postDailyFlow(client, guildId, channelId, tz);
      } catch (err) {
        logger.error({ err }, 'Failed daily flow');
      }
    },
    { timezone: tz },
  );
  logger.info({ guildId, channelId, hourLocal, tz }, 'Scheduled daily posting');
  return task;
}

