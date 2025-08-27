const { DiscordSDK } = window;
// Replace with your application's client ID
const CLIENT_ID = 'YOUR_CLIENT_ID';

const discordSdk = new DiscordSDK(CLIENT_ID);
let channelId = 'global';

async function init() {
  await discordSdk.ready();
  try {
    const { channel } = await discordSdk.commands.getChannel();
    channelId = channel.id;
  } catch {
    channelId = 'global';
  }
  loadChallenge();
  refreshLeaderboard();
}

async function loadChallenge() {
  const res = await fetch('/challenge');
  const data = await res.json();
  const link = data.link;
  const el = document.getElementById('challenge');
  if (link) {
    el.innerHTML = `<a href="${link}" target="_blank">Start today\'s challenge</a>`;
  } else {
    el.textContent = 'No challenge available.';
  }
}

async function submitScore(user, score) {
  await fetch('/score', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user, score, channel: channelId })
  });
}

async function refreshLeaderboard() {
  const res = await fetch(`/leaderboard?channel=${encodeURIComponent(channelId)}`);
  const data = await res.json();
  const list = document.getElementById('leaderboard');
  list.innerHTML = '';
  data.leaderboard.forEach((entry) => {
    const li = document.createElement('li');
    li.textContent = `${entry.user}: ${entry.score}`;
    list.appendChild(li);
  });
}

const form = document.getElementById('score-form');
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const score = Number(document.getElementById('score-input').value);
  let user;
  try {
    const result = await discordSdk.commands.getUser();
    user = result.user.username;
  } catch {
    user = 'Anonymous';
  }
  await submitScore(user, score);
  document.getElementById('score-input').value = '';
  refreshLeaderboard();
});

init();
