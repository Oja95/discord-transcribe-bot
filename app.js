import 'dotenv/config';
import express from 'express';
import {handleInteraction} from './routes/interactionsRouter.js';
import {VerifyDiscordRequest} from './services/discord.js';

// Create an express app
const app = express();

// Get port, or default to 3000
const PORT = process.env.PORT || 3000;

// Parse request body and verifies incoming requests using discord-interactions package
app.use(express.json({ verify: VerifyDiscordRequest(process.env.PUBLIC_KEY) }));

/**
 * Interactions endpoint URL where Discord will send HTTP requests
 */
app.post('/interactions', handleInteraction);

app.listen(PORT, () => {
  console.log('Listening on port', PORT);
});
