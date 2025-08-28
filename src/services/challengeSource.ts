import { env } from '../config.js';
import { prisma } from '../db/prisma.js';
import { logger } from './logger.js';
import { setTimeout as delay } from 'node:timers/promises';
import { request } from 'undici';

// Match classic challenge URLs, optionally with query string
const CHALLENGE_REGEX = /https?:\/\/(?:www\.)?geoguessr\.com\/challenge\/[A-Za-z0-9_-]+(?:\?[^\s"'>)]+)?/g;

type Cache = { list: string[]; fetchedAt: number } | null;
let cache: Cache = null;
const CACHE_TTL_MS = 5 * 60 * 1000;

export async function getAllChallenges(): Promise<string[]> {
  const now = Date.now();
  if (cache && now - cache.fetchedAt < CACHE_TTL_MS) return cache.list;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await request(env.CHALLENGE_DOC_URL, {
        method: 'GET',
        headers: { 'user-agent': 'geog-daily-bot/0.1 (+https://github.com/your-org)' },
      });
      if (res.statusCode >= 400) throw new Error(`fetch failed: ${res.statusCode}`);
      const text = await res.body.text();
      let matches = text.match(CHALLENGE_REGEX) ?? [];
      // Fallback: try global fetch if list is empty (some environments)
      if (!matches.length && typeof fetch === 'function') {
        const r2 = await fetch(env.CHALLENGE_DOC_URL, { headers: { 'user-agent': 'geog-daily-bot/0.1' } });
        if (r2.ok) {
          const t2 = await r2.text();
          matches = t2.match(CHALLENGE_REGEX) ?? [];
        }
      }
      const unique = Array.from(new Set(matches));
      cache = { list: unique, fetchedAt: now };
      return unique;
    } catch (err) {
      logger.warn({ err }, `Failed to fetch challenges (attempt ${attempt})`);
      await delay(500 * attempt);
    }
  }
  return cache?.list ?? [];
}

export async function pickChallengeForDate(
  dateKey: string,
): Promise<{ url: string; index: number }> {
  // If a challenge already persisted for this date, return it.
  const existing = await prisma.challenge.findUnique({ where: { dateKey } });
  if (existing) return { url: existing.url, index: existing.index };

  const list = await getAllChallenges();
  if (!list.length) {
    // Fallback to the most recent challenge if available
    const last = await prisma.challenge.findFirst({ orderBy: { createdAt: 'desc' } });
    if (last) {
      // Duplicate last mapping for new date to avoid blocking
      const saved = await prisma.challenge.create({ data: { dateKey, url: last.url, index: last.index } });
      logger.warn('Challenge list empty; reusing last known challenge');
      return { url: saved.url, index: saved.index };
    }
    throw new Error('No challenges available from source list');
  }

  // Determine next index using previous day if exists; else 0.
  const last = await prisma.challenge.findFirst({ orderBy: { createdAt: 'desc' } });
  const lastIndex = last?.index ?? -1;
  let index = (lastIndex + 1) % list.length;

  // Persist mapping for date
  const url = list[index];
  const saved = await prisma.challenge.create({ data: { dateKey, url, index } });
  return { url: saved.url, index: saved.index };
}
