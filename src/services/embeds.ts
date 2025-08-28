import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  type APIEmbedField,
} from 'discord.js';
import { version } from '../../package.json' assert { type: 'json' };

export function dailyEmbed(opts: {
  dateKey: string;
  challengeUrl: string;
  streak: number;
  participants: { id: string; username: string; score?: number | null }[];
}) {
  const { dateKey, challengeUrl, streak, participants } = opts;
  const fields: APIEmbedField[] = [
    {
      name: 'Challenge',
      value: `[Play now](${challengeUrl})`,
    },
    {
      name: 'Participants',
      value:
        participants.length === 0
          ? 'No submissions yet. Be the first!'
          : participants
              .map((p) => `• <@${p.id}>${p.score != null ? ` – ${p.score}` : ''}`)
              .join('\n')
              .slice(0, 1024),
    },
  ];

  const embed = new EmbedBuilder()
    .setTitle(`GeoGuessr Daily – ${dateKey}`)
    .setDescription(`Your group is on a **${streak}-day streak!** 🔥`)
    .addFields(fields)
    .setFooter({ text: `GeoGuessr Daily Bot v${version}` });

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setStyle(ButtonStyle.Link)
      .setLabel('Play now!')
      .setURL(challengeUrl),
    new ButtonBuilder().setCustomId('submit_result').setStyle(ButtonStyle.Primary).setLabel('Submit result'),
  );
  return { embed, components: [row] } as const;
}

export function summaryEmbed(opts: {
  dateKey: string;
  top: { id: string; username: string; score?: number | null }[];
  all: { id: string; username: string; score?: number | null }[];
}) {
  const { dateKey, top, all } = opts;
  const crown = top.length ? top.map((t) => `👑 <@${t.id}>${t.score != null ? ` – ${t.score}` : ''}`).join('\n') : '—';
  const everyone = all.length
    ? all.map((p) => `• <@${p.id}>${p.score != null ? ` – ${p.score}` : ''}`).join('\n').slice(0, 1024)
    : 'No submissions.';
  const embed = new EmbedBuilder()
    .setTitle(`Yesterday’s Results – ${dateKey}`)
    .addFields(
      { name: 'Top performer(s)', value: crown },
      { name: 'Submissions', value: everyone },
    )
    .setFooter({ text: 'Nice work, team! 💚' });
  return embed;
}

