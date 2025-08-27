import { Client, GatewayIntentBits, Routes, REST, SlashCommandBuilder } from 'discord.js';

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.APP_ID;
const activityId = process.env.ACTIVITY_ID;
const apiBase = process.env.API_BASE || 'http://localhost:3000';

if (!token || !clientId || !activityId) {
  console.error('Missing environment variables DISCORD_TOKEN, APP_ID, or ACTIVITY_ID');
  process.exit(1);
}

const rest = new REST({ version: '10' }).setToken(token);

async function registerCommands() {
  const commands = [
    new SlashCommandBuilder()
      .setName('geoguessr')
      .setDescription('GeoGuessr daily challenge controls')
      .addSubcommand(sub => sub
        .setName('start')
        .setDescription('Start the GeoGuessr activity'))
      .addSubcommand(sub => sub
        .setName('leaderboard')
        .setDescription('Show today\'s leaderboard'))
      .toJSON()
  ];
  await rest.put(Routes.applicationCommands(clientId), { body: commands });
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand() || interaction.commandName !== 'geoguessr') return;

  if (interaction.options.getSubcommand() === 'start') {
    const res = await fetch(`https://discord.com/api/v10/channels/${interaction.channelId}/invites`, {
      method: 'POST',
      headers: {
        'Authorization': `Bot ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        max_age: 86400,
        target_type: 2,
        target_application_id: activityId
      })
    });
    const invite = await res.json();
    await interaction.reply({ content: `Click to join the GeoGuessr challenge! https://discord.gg/${invite.code}` });
  } else if (interaction.options.getSubcommand() === 'leaderboard') {
    const res = await fetch(`${apiBase}/leaderboard?channel=${interaction.channelId}`);
    const data = await res.json();
    const message = data.leaderboard.length
      ? data.leaderboard.map((e, i) => `${i + 1}. ${e.user}: ${e.score}`).join('\n')
      : 'No scores yet.';
    await interaction.reply({ content: message, ephemeral: true });
  }
});

await registerCommands();
await client.login(token);
