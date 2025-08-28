import { Client, TextChannel } from 'discord.js';
import { formatInTimeZone } from 'date-fns-tz';
import { prisma } from '../db/prisma.js';
import { dailyEmbed, summaryEmbed } from './embeds.js';
import { pickChallengeForDate } from './challengeSource.js';
import { getTopForDate, getSubmissionsForDate } from './results.js';
import { getOrCreateStreak, updateStreakForDate } from './streaks.js';
import { env } from '../config.js';
import { logger } from './logger.js';
import { scheduleZeroSubmissionReminder } from './reminders.js';

export function dateKeyInTz(date: Date, tz: string) {
  return formatInTimeZone(date, tz, 'yyyy-MM-dd');
}

export async function postDailyFlow(client: Client, guildId: string, channelId: string, tz: string) {
  const today = new Date();
  const dateKey = dateKeyInTz(today, tz);
  const yesterdayKey = dateKeyInTz(new Date(today.getTime() - 24 * 60 * 60 * 1000), tz);

  // Post summary for yesterday
  await postSummaryIfNeeded(client, guildId, channelId, yesterdayKey);

  // Post today daily
  const { url } = await pickChallengeForDate(dateKey);
  const streak = await getOrCreateStreak(guildId);
  const subs = await getSubmissionsForDate(guildId, dateKey);
  const participants = subs.map((s) => ({ id: s.userId, username: s.username, score: s.score ?? undefined }));
  const { embed, components } = dailyEmbed({ dateKey, challengeUrl: url, streak: streak.current, participants });

  const channel = (await client.channels.fetch(channelId)) as TextChannel | null;
  if (!channel) throw new Error('Daily channel not found');

  const message = await channel.send({ embeds: [embed], components });

  const challenge = await prisma.challenge.findUnique({ where: { dateKey } });
  if (!challenge) throw new Error('Challenge not found after creation');

  await prisma.dailyGame.upsert({
    where: { guildId_dateKey: { guildId, dateKey } },
    create: {
      guildId,
      channelId,
      dateKey,
      challengeId: challenge.id,
      messageId: message.id,
    },
    update: { channelId, messageId: message.id },
  });

  // Schedule gentle reminder ~10h later if no submissions
  scheduleZeroSubmissionReminder(client, guildId, channelId, dateKey);
}

export async function postSummaryIfNeeded(client: Client, guildId: string, channelId: string, dateKey: string) {
  // Avoid duplicate summaries
  const existing = await prisma.dailyGame.findUnique({ where: { guildId_dateKey: { guildId, dateKey } } });
  if (existing?.summaryMsgId) return existing.summaryMsgId;

  const { top, all } = await getTopForDate(guildId, dateKey);
  const embed = summaryEmbed({
    dateKey,
    top: top.map((t) => ({ id: t.userId, username: t.username, score: t.score ?? undefined })),
    all: all.map((t) => ({ id: t.userId, username: t.username, score: t.score ?? undefined })),
  });

  const ch = (await client.channels.fetch(channelId)) as TextChannel | null;
  if (!ch) return null;
  const msg = await ch.send({ embeds: [embed] });

  // Update streak based on min submissions
  const min = env.MIN_SUBMISSIONS_FOR_GROUP_STREAK;
  const didCount = all.length >= min;
  await updateStreakForDate(guildId, dateKey, didCount);

  if (existing) {
    await prisma.dailyGame.update({ where: { id: existing.id }, data: { summaryMsgId: msg.id } });
  }
  return msg.id;
}
