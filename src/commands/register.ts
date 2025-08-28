import { REST, Routes, SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { env } from '../config.js';
import { prisma } from '../db/prisma.js';
import { logger } from '../services/logger.js';

export async function registerSlashCommands(global = false) {
  const commands = [
    // Compatibility alias: /geoguessr start
    new SlashCommandBuilder()
      .setName('geoguessr')
      .setDescription('GeoGuessr daily helper commands')
      .addSubcommand((s) => s.setName('start').setDescription('Post today’s daily now')),
    new SlashCommandBuilder()
      .setName('register')
      .setDescription('Register this channel for daily GeoGuessr')
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
    new SlashCommandBuilder()
      .setName('setchannel')
      .setDescription('Set the channel for daily posts')
      .addChannelOption((opt) => opt.setName('channel').setDescription('Channel').setRequired(true))
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
    new SlashCommandBuilder()
      .setName('settime')
      .setDescription('Set the hour (0-23) and tz for daily posting')
      .addIntegerOption((opt) => opt.setName('hour').setDescription('0..23').setMinValue(0).setMaxValue(23).setRequired(true))
      .addStringOption((opt) => opt.setName('tz').setDescription('IANA timezone').setRequired(true))
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
    new SlashCommandBuilder().setName('playtoday').setDescription('Repost today embed or show challenge URL'),
    new SlashCommandBuilder()
      .setName('submit')
      .setDescription('Submit your result')
      .addIntegerOption((opt) => opt.setName('score').setDescription('Score (optional)').setRequired(false))
      .addStringOption((opt) => opt.setName('proof').setDescription('Proof text or link').setRequired(false)),
    new SlashCommandBuilder()
      .setName('leaderboard')
      .setDescription('Show leaderboard')
      .addStringOption((opt) =>
        opt.setName('period').setDescription('week|month|all').addChoices(
          { name: 'week', value: 'week' },
          { name: 'month', value: 'month' },
          { name: 'all', value: 'all' },
        ),
      ),
    new SlashCommandBuilder().setName('streak').setDescription('Show group streak'),
    new SlashCommandBuilder()
      .setName('rerun')
      .setDescription('Recompute summary for a date')
      .addStringOption((opt) => opt.setName('date').setDescription('YYYY-MM-DD').setRequired(true))
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
    new SlashCommandBuilder()
      .setName('sourcecheck')
      .setDescription('Admin: Fetch challenge source and show sample')
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  ].map((c) => c.toJSON());

  const rest = new REST({ version: '10' }).setToken(env.DISCORD_TOKEN);
  if (env.GUILD_ID) {
    await rest.put(Routes.applicationGuildCommands(env.DISCORD_APP_ID, env.GUILD_ID), { body: commands });
    logger.info('Registered guild slash commands');
  } else {
    logger.info('No GUILD_ID; skipping guild command registration');
  }

  if (global) {
    await rest.put(Routes.applicationCommands(env.DISCORD_APP_ID), { body: commands });
    logger.info('Registered global slash commands');
  }
}

// Allow running directly: pnpm/npm run register:dev
if (import.meta.url === `file://${process.argv[1]}`) {
  registerSlashCommands(true).catch((e) => {
    logger.error(e, 'Failed to register commands');
    process.exit(1);
  });
}
