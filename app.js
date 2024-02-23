import 'dotenv/config';
import express from 'express';
import fs from 'fs'
import * as http from 'https';
import * as https from 'https';
import {
  InteractionType,
  InteractionResponseType
} from 'discord-interactions';
import { VerifyDiscordRequest, DiscordRequest, DeepInfraRequest } from './utils.js';


var key = fs.readFileSync(process.env.SSL_KEY_PATH);
var cert = fs.readFileSync(process.env.SSL_CERT_PATH);
var options = {
  key: key,
  cert: cert
};


// Create an express app
const app = express();

// Get port, or default to 3000
const PORT = process.env.PORT || 3000;

// Parse request body and verifies incoming requests using discord-interactions package
app.use(express.json({ verify: VerifyDiscordRequest(process.env.PUBLIC_KEY) }));



/**
 * Interactions endpoint URL where Discord will send HTTP requests
 */
app.post('/interactions', async function (req, res) {

  console.log(req.body);
  const { type, id, data, channel_id, token } = req.body;

  /**
   * Handle verification requests
   */
  if (type === InteractionType.PING) {
    return res.send({ type: InteractionResponseType.PONG });
  }

  /**
   * Handle slash command requests
   * See https://discord.com/developers/docs/interactions/application-commands#slash-commands
   */
  if (type === InteractionType.APPLICATION_COMMAND) {
    const { name } = data;

    if (name === 'what-did-you-say' || name === 'what-did-you-say-id') {
      let audioFileUrl;

      if (name === 'what-did-you-say-id') {
        const messageId = data?.options[0]?.value;
        var response = await DiscordRequest(`channels/${channel_id}/messages/${messageId}`, { method: 'GET'});

        if (!response.ok) {
          res.send({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
              content: `Failed to fetch channel message with ID ${messageId}!`
            }
          });
          return;
        }

        const messagesData = await response.json();
        const suitableAudioAttachments = messagesData.attachments.filter(attachment => attachment.filename.endsWith(".ogg"));

        if (suitableAudioAttachments.length > 0) {
          audioFileUrl = suitableAudioAttachments[0].url;
        } else {
          res.send({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
              content: `Found no audio file to process with given ID ${messageId}! :(`
            }
          });
          return;
        }
      } else if (name === 'what-did-you-say') {
        // Gets the last 50 messages. Assuming that the order is latest messages first
        var response = await DiscordRequest(`channels/${channel_id}/messages`, { method: 'GET'});
        const data = await response.json();

        const audioMessages = data.filter(message => message.attachments.length > 0 && message.attachments.filter(attachment => attachment.filename.endsWith(".ogg")).length > 0);
        if (audioMessages.length > 0) {
          audioFileUrl = audioMessages[0].attachments.filter(attachment => attachment.filename.endsWith(".ogg"))[0].url;
        } else {
          res.send({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
              content: `Found no audio file to process within the last 50 channel messages!`
            }
          });
          return;
        }
      
      }

      res.send({
        type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: `Found voice message, processing.`
        },
      });
      
      var aiResponse = await DeepInfraRequest(audioFileUrl);
      const aiData = await aiResponse.json();

      console.log(`Transcription result: ${aiData.text}`);

      // Modifies the original 'Bot is thinking' text with the result.
      await DiscordRequest(`webhooks/1208078761807847434/${token}/messages/@original`,  
          { method: 'PATCH',
            body: {
              content: `${aiData.text}`
            }
          }
        );
      return;
    }
  }
}); 

var httpServer = http.createServer(app);
var httpsServer = https.createServer(options, app);

httpsServer.listen(PORT, () => {
  console.log('HTTPS listening on port', PORT);
});

httpServer.listen(8080, () => {
  console.log('HTTP listening on port', 8080);
});
