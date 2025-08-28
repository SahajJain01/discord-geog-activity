import { ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';
import { prisma } from '../db/prisma.js';

export async function handleSetTime(interaction: ChatInputCommandInteraction) {
  if (!interaction.inGuild()) return interaction.reply({ content: 'Guild only.', ephemeral: true });
  const member = interaction.member;
  if (
    !('permissions' in member) ||
    !member.permissions.has(PermissionFlagsBits.ManageGuild)
  )
    return interaction.reply({ content: 'Missing permissions.', ephemeral: true });

  const hour = interaction.options.getInteger('hour', true);
  const tz = interaction.options.getString('tz', true);

  await prisma.guildConfig.upsert({
    where: { guildId: interaction.guildId! },
    create: {
      guildId: interaction.guildId!,
      dailyChannelId: interaction.channelId!,
      dailyHourLocal: hour,
      tz,
    },
    update: { dailyHourLocal: hour, tz },
  });

  return interaction.reply({ content: `Time set: ${hour}:00 ${tz}`, ephemeral: true });
}

