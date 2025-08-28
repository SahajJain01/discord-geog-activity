import { prisma } from '../db/prisma.js';

export async function upsertSubmission(params: {
  guildId: string;
  dateKey: string;
  userId: string;
  username: string;
  score?: number | null;
  rawText?: string | null;
  imageUrl?: string | null;
}) {
  const { guildId, dateKey, userId, username, score = null, rawText = null, imageUrl = null } = params;
  const sub = await prisma.submission.upsert({
    where: { guildId_dateKey_userId: { guildId, dateKey, userId } },
    create: { guildId, dateKey, userId, username, score, rawText, imageUrl },
    update: { username, score, rawText, imageUrl },
  });
  return sub;
}

export function parseScoreFromText(text?: string | null): number | null {
  if (!text) return null;
  const nums = Array.from(text.matchAll(/(\d[\d,.]*)/g)).map((m) => Number(String(m[1]).replace(/[,]/g, '')));
  if (!nums.length) return null;
  return Math.max(...nums.filter((n) => Number.isFinite(n)));
}

export async function getSubmissionsForDate(guildId: string, dateKey: string) {
  return prisma.submission.findMany({ where: { guildId, dateKey }, orderBy: [{ score: 'asc' }, { submittedAt: 'asc' }] });
}

export async function getTopForDate(guildId: string, dateKey: string) {
  const all = await getSubmissionsForDate(guildId, dateKey);
  if (!all.length) return { top: [] as typeof all, all };
  const scored = all.filter((s) => s.score != null);
  if (!scored.length) return { top: [], all };
  const bestScore = Math.min(...scored.map((s) => s.score!));
  const top = scored.filter((s) => s.score === bestScore);
  return { top, all };
}

export async function leaderboardByPeriod(guildId: string, period: 'week' | 'month' | 'all') {
  const where: any = { guildId };
  if (period !== 'all') {
    const now = new Date();
    const start = new Date(now);
    if (period === 'week') {
      start.setDate(now.getDate() - 7);
    } else if (period === 'month') {
      start.setMonth(now.getMonth() - 1);
    }
    where.submittedAt = { gte: start };
  }
  const subs = await prisma.submission.findMany({ where });
  const map = new Map<string, { userId: string; username: string; count: number; avg?: number | null }>();
  for (const s of subs) {
    const key = s.userId;
    const cur = map.get(key) ?? { userId: s.userId, username: s.username, count: 0, avg: null };
    cur.count += 1;
    if (s.score != null) {
      const prevTotal = (cur.avg ?? 0) * (cur.count - 1);
      cur.avg = (prevTotal + s.score) / cur.count;
    }
    map.set(key, cur);
  }
  const list = Array.from(map.values()).sort((a, b) => b.count - a.count || (a.avg ?? Infinity) - (b.avg ?? Infinity));
  return list;
}

