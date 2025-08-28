import { ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';
import { prisma } from '../db/prisma.js';
import { postSummaryIfNeeded } from '../services/gameEngine.js';

export async function handleRerun(interaction: ChatInputCommandInteraction) {
  if (!interaction.inGuild()) return interaction.reply({ content: 'Guild only.', ephemeral: true });
  const member = interaction.member;
  if (
    !('permissions' in member) ||
    !member.permissions.has(PermissionFlagsBits.ManageGuild)
  )
    return interaction.reply({ content: 'Missing permissions.', ephemeral: true });
  const date = interaction.options.getString('date', true);
  const cfg = await prisma.guildConfig.findUnique({ where: { guildId: interaction.guildId! } });
  if (!cfg) return interaction.reply({ content: 'Server not registered. Use /register.', ephemeral: true });
  await interaction.deferReply({ ephemeral: true });
  const id = await postSummaryIfNeeded(interaction.client, interaction.guildId!, cfg.dailyChannelId, date);
  return interaction.editReply(`Summary posted/updated for ${date} (${id ?? 'no message'})`);
}

