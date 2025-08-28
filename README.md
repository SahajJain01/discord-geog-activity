# GeoGuessr Daily Discord Bot

Posts a daily GeoGuessr challenge from a public Google Doc, tracks submissions, group streaks, and posts a daily summary like Wordle. Works in text channels with slash commands. Built with Node.js (ESM), TypeScript, discord.js v14, Prisma + SQLite, and node-cron.

## Features

- Daily post with “Play now!” link button and submit modal
- Parses a Google Doc TXT export for GeoGuessr challenge URLs
- Tracks per-user submissions and crowns daily top performer(s)
- Group streak logic with configurable minimum submissions
- Daily summary embed posted before the new daily
- Slash commands: `/register`, `/setchannel`, `/settime`, `/playtoday`, `/submit`, `/leaderboard`, `/streak`, `/rerun`

## Tech

- Node.js 20+, ESM modules + TypeScript
- discord.js v14
- Prisma + SQLite
- node-cron
- zod, dotenv, undici, date-fns-tz, pino

## Setup

1. Create a Discord bot in Developer Portal. Invite with `bot` and `applications.commands` scopes. Permissions: Send Messages, Manage Messages, Use Slash Commands.
2. Copy `.env.example` to `.env` and fill values:

```
DISCORD_TOKEN=...
DISCORD_APP_ID=...
GUILD_ID=...                  # optional, for dev registration
DAILY_TZ=Asia/Ho_Chi_Minh
DAILY_HOUR=08
CHALLENGE_DOC_URL=https://docs.google.com/document/d/1ik_dKTnmEb3R3UaY8bP48H9GoWgprJ2m9LTDIDD0CD8/export?format=txt
MIN_SUBMISSIONS_FOR_GROUP_STREAK=1
```

3. Install and init DB

```
npm i
npx prisma migrate dev --name init
```

4. Run

```
npm run dev
```

5. In your server, run `/register` in the channel you want daily posts.

## Commands

- `/register` – Register current channel for dailies.
- `/setchannel #channel` – Admin: change daily channel.
- `/settime hour:<0..23> tz:<IANA>` – Admin: change posting hour/timezone.
- `/playtoday` – Repost today’s embed if missing; returns challenge link.
- `/submit score:<int?> proof:<string?>` – Submit manually (modal is default).
- `/leaderboard period:<week|month|all>` – Show rankings.
- `/streak` – Show group streak.
- `/rerun date:<YYYY-MM-DD>` – Admin: recompute a past day’s summary.

## Acceptance Checklist

- `/register` creates or updates `GuildConfig` and acknowledges.
- At configured local hour, bot posts daily embed with a real GeoGuessr URL.
- Submit modal stores `Submission` and updates participants list in embed.
- Next day, bot posts summary crowning top performer(s) and updates `GroupStreak`.
- `/leaderboard` returns requested period ranks.

## Notes

- The bot uses ESM; run with Node 20+.
- Uses Node’s global `fetch` via undici’s request (robust retries).
- Edits on message failures handle 429/5xx via discord.js retry behavior.

