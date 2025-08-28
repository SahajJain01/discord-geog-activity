import { prisma } from '../db/prisma.js';

export async function getOrCreateStreak(guildId: string) {
  const s = await prisma.groupStreak.upsert({
    where: { guildId },
    create: { guildId },
    update: {},
  });
  return s;
}

export async function updateStreakForDate(
  guildId: string,
  dateKeyYesterday: string,
  didCount: boolean,
) {
  const s = await getOrCreateStreak(guildId);
  if (s.lastDate === dateKeyYesterday) return s; // already applied
  if (didCount) {
    const current = s.current + 1;
    const best = Math.max(s.best, current);
    return prisma.groupStreak.update({ where: { guildId }, data: { current, best, lastDate: dateKeyYesterday } });
  } else {
    return prisma.groupStreak.update({ where: { guildId }, data: { current: 0, lastDate: dateKeyYesterday } });
  }
}

