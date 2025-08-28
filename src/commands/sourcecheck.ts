import { ChatInputCommandInteraction } from 'discord.js';
import { getAllChallenges } from '../services/challengeSource.js';
import { env } from '../config.js';

export async function handleSourceCheck(interaction: ChatInputCommandInteraction) {
  if (!interaction.inGuild()) return interaction.reply({ content: 'Guild only.', ephemeral: true });
  await interaction.deferReply({ ephemeral: true });
  try {
    const list = await getAllChallenges();
    const sample = list.slice(0, 3).join('\n') || '(none)';
    await interaction.editReply(
      `URL: ${env.CHALLENGE_DOC_URL}\nFound ${list.length} link(s).\nSample:\n${sample}`,
    );
  } catch (e: any) {
    await interaction.editReply(`Failed to fetch source: ${e?.message ?? e}`);
  }
}

