// Quick SQLite bootstrap using bun:sqlite, to work around prisma migrate on this host
import { Database } from 'bun:sqlite';
import { mkdirSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const dbPath = resolve('prisma', 'dev.db');
mkdirSync(dirname(dbPath), { recursive: true });
const db = new Database(dbPath);

const sql = `
-- CreateTable
CREATE TABLE IF NOT EXISTS "GuildConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "guildId" TEXT NOT NULL,
    "dailyChannelId" TEXT NOT NULL,
    "dailyHourLocal" INTEGER NOT NULL DEFAULT 8,
    "tz" TEXT NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
    "minSubsForStreak" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Challenge" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dateKey" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "index" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "DailyGame" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "guildId" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "dateKey" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "postedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "summaryMsgId" TEXT
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Submission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "guildId" TEXT NOT NULL,
    "dateKey" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "score" INTEGER,
    "rawText" TEXT,
    "imageUrl" TEXT,
    "submittedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "GroupStreak" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "guildId" TEXT NOT NULL,
    "current" INTEGER NOT NULL DEFAULT 0,
    "best" INTEGER NOT NULL DEFAULT 0,
    "lastDate" TEXT
);

-- Indexes
CREATE UNIQUE INDEX IF NOT EXISTS "GuildConfig_guildId_key" ON "GuildConfig"("guildId");
CREATE UNIQUE INDEX IF NOT EXISTS "Challenge_dateKey_key" ON "Challenge"("dateKey");
CREATE UNIQUE INDEX IF NOT EXISTS "DailyGame_guildId_dateKey_key" ON "DailyGame"("guildId", "dateKey");
CREATE UNIQUE INDEX IF NOT EXISTS "Submission_guildId_dateKey_userId_key" ON "Submission"("guildId", "dateKey", "userId");
CREATE UNIQUE INDEX IF NOT EXISTS "GroupStreak_guildId_key" ON "GroupStreak"("guildId");
`;

db.exec(sql);
console.log(`SQLite initialized at ${dbPath}`);

