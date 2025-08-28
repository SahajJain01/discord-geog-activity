import { ChatInputCommandInteraction, ChannelType, PermissionFlagsBits, TextChannel } from 'discord.js';
import { prisma } from '../db/prisma.js';
import { env } from '../config.js';

export async function handleSetChannel(interaction: ChatInputCommandInteraction) {
  if (!interaction.inGuild()) return interaction.reply({ content: 'Guild only.', ephemeral: true });
  const member = interaction.member;
  if (
    !('permissions' in member) ||
    !member.permissions.has(PermissionFlagsBits.ManageGuild)
  )
    return interaction.reply({ content: 'Missing permissions.', ephemeral: true });

  const channel = interaction.options.getChannel('channel', true);
  if (channel.type !== ChannelType.GuildText) return interaction.reply({ content: 'Pick a text channel.', ephemeral: true });

  await prisma.guildConfig.upsert({
    where: { guildId: interaction.guildId! },
    create: {
      guildId: interaction.guildId!,
      dailyChannelId: channel.id,
      dailyHourLocal: env.DAILY_HOUR,
      tz: env.DAILY_TZ,
      minSubsForStreak: env.MIN_SUBMISSIONS_FOR_GROUP_STREAK,
    },
    update: { dailyChannelId: channel.id },
  });

  return interaction.reply({ content: `Daily channel set to <#${channel.id}>`, ephemeral: true });
}

