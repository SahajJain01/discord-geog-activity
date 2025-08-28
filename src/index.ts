import 'dotenv/config';
import {
  Client,
  GatewayIntentBits,
  Partials,
  InteractionType,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
} from 'discord.js';
import { env } from './config.js';
import { logger } from './services/logger.js';
import { prisma } from './db/prisma.js';
import { registerSlashCommands } from './commands/register.js';
import { initScheduler } from './scheduler.js';
import { handleSetChannel } from './commands/setchannel.js';
import { handleSetTime } from './commands/settime.js';
import { handlePlayToday } from './commands/playtoday.js';
import { handleLeaderboard } from './commands/leaderboard.js';
import { handleStreak } from './commands/streak.js';
import { handleSubmit } from './commands/submit.js';
import { handleRerun } from './commands/rerun.js';
import { handleSourceCheck } from './commands/sourcecheck.js';
import { upsertSubmission, parseScoreFromText } from './services/results.js';
import { dateKeyInTz } from './services/gameEngine.js';
import { dailyEmbed } from './services/embeds.js';

async function main() {
  await registerSlashCommands(true).catch((e) => logger.warn(e, 'Command registration skipped'));

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.DirectMessages,
    ],
    partials: [Partials.Channel, Partials.Message],
  });

  client.once('ready', async () => {
    logger.info(`Logged in as ${client.user?.tag}`);
    await initScheduler(client);
  });

  client.on('interactionCreate', async (interaction) => {
    try {
      if (interaction.isChatInputCommand()) {
        if (interaction.commandName === 'geoguessr') {
          const sub = interaction.options.getSubcommand(false);
          if (sub === 'start') {
            // Alias to /playtoday
            return handlePlayToday(interaction);
          }
        }
        if (interaction.commandName === 'register') {
          if (!interaction.inGuild()) return interaction.reply({ content: 'Guild only.', ephemeral: true });
          await prisma.guildConfig.upsert({
            where: { guildId: interaction.guildId! },
            create: {
              guildId: interaction.guildId!,
              dailyChannelId: interaction.channelId,
              dailyHourLocal: env.DAILY_HOUR,
              tz: env.DAILY_TZ,
              minSubsForStreak: env.MIN_SUBMISSIONS_FOR_GROUP_STREAK,
            },
            update: {},
          });
          await interaction.reply({ content: 'Registered this channel for dailies ✅', ephemeral: true });
          return;
        }
        if (interaction.commandName === 'setchannel') return handleSetChannel(interaction);
        if (interaction.commandName === 'settime') return handleSetTime(interaction);
        if (interaction.commandName === 'playtoday') return handlePlayToday(interaction);
        if (interaction.commandName === 'leaderboard') return handleLeaderboard(interaction);
        if (interaction.commandName === 'streak') return handleStreak(interaction);
        if (interaction.commandName === 'submit') return handleSubmit(interaction);
        if (interaction.commandName === 'rerun') return handleRerun(interaction);
        if (interaction.commandName === 'sourcecheck') return handleSourceCheck(interaction);

        // Fallback for unknown commands still registered on the app
        return interaction.reply({
          content:
            `Unknown command: /${interaction.commandName}. Try: /register, /playtoday, /submit, /leaderboard, /streak, /setchannel, /settime, /rerun`,
          ephemeral: true,
        });
      }

      if (interaction.isButton() && interaction.customId === 'submit_result') {
        const modal = new ModalBuilder().setCustomId('submit_modal').setTitle('Submit Result');
        const score = new TextInputBuilder()
          .setCustomId('score')
          .setLabel('Score or Rank (optional)')
          .setStyle(TextInputStyle.Short)
          .setRequired(false);
        const proof = new TextInputBuilder()
          .setCustomId('proof')
          .setLabel('Proof (paste result text or link)')
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(false);
        const row1 = new ActionRowBuilder<TextInputBuilder>().addComponents(score);
        const row2 = new ActionRowBuilder<TextInputBuilder>().addComponents(proof);
        modal.addComponents(row1, row2);
        await interaction.showModal(modal);
        return;
      }

      if (interaction.type === InteractionType.ModalSubmit && interaction.customId === 'submit_modal') {
        if (!interaction.inGuild()) return interaction.reply({ content: 'Guild only.', ephemeral: true });
        const cfg = await prisma.guildConfig.findUnique({ where: { guildId: interaction.guildId! } });
        if (!cfg) return interaction.reply({ content: 'Server not registered. Use /register.', ephemeral: true });
        const scoreRaw = interaction.fields.getTextInputValue('score');
        const proof = interaction.fields.getTextInputValue('proof');
        const parsedFromProof = parseScoreFromText(proof);
        const score = Number(scoreRaw);
        const finalScore = Number.isFinite(score) && scoreRaw !== '' ? score : parsedFromProof;
        const dateKey = dateKeyInTz(new Date(), cfg.tz);

        await upsertSubmission({
          guildId: interaction.guildId!,
          dateKey,
          userId: interaction.user.id,
          username: interaction.user.username,
          score: finalScore ?? null,
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
          } catch (e) {
            // Non-fatal; continue
          }
        }

        await interaction.reply({ content: 'Submission saved ✅', ephemeral: true });
        return;
      }
    } catch (err) {
      logger.error({ err }, 'Interaction error');
      if (interaction.isRepliable()) {
        try {
          const content = 'Something went wrong. Please try again later.';
          if ((interaction as any).deferred || (interaction as any).replied) {
            await interaction.editReply(content);
          } else {
            await interaction.reply({ content, ephemeral: true });
          }
        } catch {}
      }
    }
  });

  await client.login(env.DISCORD_TOKEN);
}

main().catch((err) => {
  logger.error({ err }, 'Fatal error');
  process.exit(1);
});
