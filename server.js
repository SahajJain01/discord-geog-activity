import express from 'express';
import { promises as fs } from 'fs';
import path from 'path';

const app = express();
app.use(express.json());
app.use(express.static('public'));

const SCORES_FILE = path.join(process.cwd(), 'scores.json');
const GOOGLE_DOC = 'https://docs.google.com/document/d/1ik_dKTnmEb3R3UaY8bP48H9GoWgprJ2m9LTDIDD0CD8/export?format=txt';

async function readScores() {
  try {
    const data = await fs.readFile(SCORES_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return {};
  }
}

async function writeScores(scores) {
  await fs.writeFile(SCORES_FILE, JSON.stringify(scores, null, 2));
}

async function getDailyChallenge() {
  const res = await fetch(GOOGLE_DOC);
  const text = await res.text();
  const links = text.match(/https?:\/\/[^\s]+/g) || [];
  if (!links.length) return null;
  const index = new Date().getDate() % links.length;
  return links[index];
}

app.get('/challenge', async (req, res) => {
  const link = await getDailyChallenge();
  if (!link) return res.status(500).json({ error: 'No challenge links found' });
  res.json({ link });
});

app.post('/score', async (req, res) => {
  const { user, score, channel = 'global' } = req.body;
  if (!user || typeof score !== 'number') {
    return res.status(400).json({ error: 'Invalid payload' });
  }
  const scores = await readScores();
  scores[channel] = scores[channel] || {};
  scores[channel][user] = score;
  await writeScores(scores);
  res.json({ ok: true });
});

app.get('/leaderboard', async (req, res) => {
  const channel = req.query.channel || 'global';
  const scores = await readScores();
  const channelScores = scores[channel] || {};
  const sorted = Object.entries(channelScores)
    .map(([user, score]) => ({ user, score }))
    .sort((a, b) => b.score - a.score);
  res.json({ leaderboard: sorted });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
