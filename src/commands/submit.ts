import { ChatInputCommandInteraction } from 'discord.js';
import { prisma } from '../db/prisma.js';
import { dateKeyInTz } from '../services/gameEngine.js';
import { upsertSubmission, parseScoreFromText } from '../services/results.js';
import { dailyEmbed } from '../services/embeds.js';

export async function handleSubmit(interaction: ChatInputCommandInteraction) {
  if (!interaction.inGuild()) return interaction.reply({ content: 'Guild only.', ephemeral: true });
  const cfg = await prisma.guildConfig.findUnique({ where: { guildId: interaction.guildId! } });
  if (!cfg) return interaction.reply({ content: 'Server not registered. Use /register.', ephemeral: true });

  const scoreOpt = interaction.options.getInteger('score', false);
  const proof = interaction.options.getString('proof', false);
  const dateKey = dateKeyInTz(new Date(), cfg.tz);
  const score = scoreOpt ?? parseScoreFromText(proof ?? undefined);

  await upsertSubmission({
    guildId: interaction.guildId!,
    dateKey,
    userId: interaction.user.id,
    username: interaction.user.username,
    score: score ?? null,
    rawText: proof ?? null,
  });

  // Update daily embed participants if possible
  const game = await prisma.dailyGame.findUnique({ where: { guildId_dateKey: { guildId: interaction.guildId!, dateKey } } });
  if (game) {
    try {
      const subs = await prisma.submission.findMany({ where: { guildId: interaction.guildId!, dateKey } });
      const participants = subs.map((s) => ({ id: s.userId, username: s.username, score: s.score ?? undefined }));
      const challenge = await prisma.challenge.findUnique({ where: { dateKey } });
      if (challenge) {
        const streak = await prisma.groupStreak.upsert({ where: { guildId: interaction.guildId! }, create: { guildId: interaction.guildId! }, update: {} });
        const { embed, components } = dailyEmbed({ dateKey, challengeUrl: challenge.url, streak: streak.current, participants });
        const channel = await interaction.client.channels.fetch(game.channelId);
        if (channel && channel.isTextBased()) {
          const msg = await (channel as any).messages.fetch(game.messageId);
          await msg.edit({ embeds: [embed], components });
        }
      }
    } catch {}
  }

  return interaction.reply({ content: 'Submission saved ✅', ephemeral: true });
}
