import 'dotenv/config';
import { z } from 'zod';

const EnvSchema = z.object({
  DISCORD_TOKEN: z.string().min(1, 'DISCORD_TOKEN is required'),
  DISCORD_APP_ID: z.string().min(1, 'DISCORD_APP_ID is required'),
  DISCORD_PUBLIC_KEY: z.string().optional().default(''),
  GUILD_ID: z.string().optional(),
  DAILY_TZ: z.string().default('Asia/Ho_Chi_Minh'),
  DAILY_HOUR: z
    .string()
    .default('08')
    .transform((s) => {
      const n = Number(s);
      if (!Number.isFinite(n) || n < 0 || n > 23) return 8;
      return n;
    }),
  CHALLENGE_DOC_URL: z
    .string()
    .url()
    .default(
      'https://docs.google.com/document/d/1ik_dKTnmEb3R3UaY8bP48H9GoWgprJ2m9LTDIDD0CD8/export?format=txt',
    ),
  MIN_SUBMISSIONS_FOR_GROUP_STREAK: z
    .string()
    .default('1')
    .transform((s) => Math.max(0, Number(s) || 1)),
});

export type Env = z.infer<typeof EnvSchema>;

export const env: Env = EnvSchema.parse(process.env);

