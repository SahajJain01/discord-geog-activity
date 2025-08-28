import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { leaderboardByPeriod } from '../services/results.js';

export async function handleLeaderboard(interaction: ChatInputCommandInteraction) {
  if (!interaction.inGuild()) return interaction.reply({ content: 'Guild only.', ephemeral: true });
  const period = (interaction.options.getString('period') as 'week' | 'month' | 'all' | null) ?? 'week';
  const data = await leaderboardByPeriod(interaction.guildId!, period);
  const lines = data
    .slice(0, 20)
    .map((r, i) => `${i + 1}. <@${r.userId}> — ${r.count} subs${r.avg != null ? `, avg ${r.avg.toFixed(0)}` : ''}`);
  const embed = new EmbedBuilder()
    .setTitle(`Leaderboard (${period})`)
    .setDescription(lines.join('\n') || 'No data.');
  return interaction.reply({ embeds: [embed], ephemeral: true });
}

