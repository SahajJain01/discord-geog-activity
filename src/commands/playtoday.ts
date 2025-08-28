import { ChatInputCommandInteraction, PermissionFlagsBits, TextChannel } from 'discord.js';
import { prisma } from '../db/prisma.js';
import { postDailyFlow, dateKeyInTz } from '../services/gameEngine.js';

export async function handlePlayToday(interaction: ChatInputCommandInteraction) {
  if (!interaction.inGuild()) return interaction.reply({ content: 'Guild only.', ephemeral: true });
  const cfg = await prisma.guildConfig.findUnique({ where: { guildId: interaction.guildId! } });
  if (!cfg) return interaction.reply({ content: 'Server not registered. Use /register.', ephemeral: true });
  await interaction.deferReply({ ephemeral: true });
  try {
    await postDailyFlow(interaction.client, cfg.guildId, cfg.dailyChannelId, cfg.tz);
    const dateKey = dateKeyInTz(new Date(), cfg.tz);
    const challenge = await prisma.challenge.findUnique({ where: { dateKey } });
    const url = challenge?.url ?? '(unavailable)';
    return interaction.editReply(`Daily posted. Challenge: ${url}`);
  } catch (e: any) {
    const msg = e?.message?.includes('No challenges')
      ? 'Challenge source has no links. Update CHALLENGE_DOC_URL to a Google Doc containing GeoGuessr challenge links.'
      : 'Failed to post daily. Please try again later.';
    return interaction.editReply(msg);
  }
}
