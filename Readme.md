# Discord GeoGuessr Daily Challenge Activity

This project provides a custom Discord Activity where server members can play a daily [GeoGuessr](https://www.geoguessr.com/) challenge together. The activity fetches challenge links from a shared Google Doc and tracks submitted scores on a simple leaderboard.

## Features
- Uses the Discord Activities API to run inside a voice or text channel.
- Fetches the daily challenge link from the provided Google Doc.
- Participants submit their scores and see a channel-specific leaderboard.

## Setup
1. Create a Discord application and enable the **Embedded App** feature to obtain a client ID.
2. Clone this repository and install dependencies:
   ```bash
   npm install
   ```
3. Set the client ID in `public/activity.js` by replacing `YOUR_CLIENT_ID`.
4. Create a bot token for the same application and note its ID.
5. Provide the following environment variables when running the bot:
   - `DISCORD_TOKEN`: bot token
   - `APP_ID`: application ID
   - `ACTIVITY_ID`: application ID of the embedded activity (same as `APP_ID`)
   - `API_BASE` (optional): URL of the activity server (`http://localhost:3000` by default)
6. Start the activity server and bot in separate terminals:
   ```bash
   npm start        # serves the embedded activity
   npm run bot      # registers slash commands and handles interactions
   ```
7. In Discord, use `/geoguessr start` in a channel to create an invite for the activity.
8. Use `/geoguessr leaderboard` to show scores for the current channel.

Scores are stored in `scores.json` which is ignored by git so player data isn't committed.
