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
4. Start the activity server:
   ```bash
   npm start
   ```
5. Use the Discord developer tools to launch the custom activity in any voice or text channel pointing to your server's URL.

Scores are stored in `scores.json` which is ignored by git so player data isn't committed.
