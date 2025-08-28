import cron from 'node-cron';
import { prisma } from '../db/prisma.js';
import { logger } from './logger.js';
import { Client, TextChannel } from 'discord.js';

export function scheduleZeroSubmissionReminder(client: Client, guildId: string, channelId: string, dateKey: string) {
  // Schedule a one-off cron ~10 hours later; we’ll cancel it after run.
  const task = cron.schedule('* * * * *', async () => {
    // This cron runs every minute, but we gate by timestamp stored in DB.
    try {
      const game = await prisma.dailyGame.findUnique({ where: { guildId_dateKey: { guildId, dateKey } } });
      if (!game) return;
      const count = await prisma.submission.count({ where: { guildId, dateKey } });
      if (count > 0) {
        task.stop();
        return;
      }
      const created = new Date(game.postedAt).getTime();
      const now = Date.now();
      if (now - created > 10 * 60 * 60 * 1000) {
        // 10 hours passed, post reminder
        const ch = (await client.channels.fetch(channelId)) as TextChannel | null;
        if (ch) await ch.send('🟩 New puzzle is live!');
        task.stop();
      }
    } catch (err) {
      logger.warn({ err }, 'Reminder check failed');
    }
  });
  return task;
}

