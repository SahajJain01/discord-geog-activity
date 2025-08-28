import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { getOrCreateStreak } from '../services/streaks.js';

export async function handleStreak(interaction: ChatInputCommandInteraction) {
  if (!interaction.inGuild()) return interaction.reply({ content: 'Guild only.', ephemeral: true });
  const s = await getOrCreateStreak(interaction.guildId!);
  const embed = new EmbedBuilder()
    .setTitle('Group Streak')
    .setDescription(`Current: ${s.current} day(s)\nBest: ${s.best} day(s)`);
  return interaction.reply({ embeds: [embed], ephemeral: true });
}

