import 'dotenv/config';
import express from 'express';
import {
  InteractionType,
  InteractionResponseType
} from 'discord-interactions';
import { VerifyDiscordRequest, DiscordRequest, DeepInfraRequest } from './utils.js';

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
  const { type, id, data, guild, channel_id, token } = req.body;

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

    // could be imported from commands.js
    const commands = ['what-did-you-say-id', 'what-did-you-say', 'uwotm8']

    if (!commands.includes(name)) {
      // default to answering at least something on invalid use
      res.status(400).send("invalid request, no valid discord command included\n");
      return;
    }

    let audioFileUrl;
    let messageLink;

    if (name === 'what-did-you-say-id') {
      let messageId = data?.options[0]?.value;

      // if messageId is actually a link to the message, get actual message id from it
      // link format is: discord.com/channels/guild-id/channel-id/message-id
      const re = /https?:\/\/discord.com\/channels\/\d+\/\d+\/(\d+)/;
      const re_match = messageId.match(re);
      if (re_match.length === 2) {
        // save link for later use
        messageLink = messageId;
        messageId = re_match[1];
      }

      var response = await DiscordRequest(`channels/${channel_id}/messages/${messageId}`, { method: 'GET' });

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
    } else if (['what-did-you-say', 'uwotm8'].includes(name)) {
      // Gets the last 50 messages. Assuming that the order is latest messages first
      var response = await DiscordRequest(`channels/${channel_id}/messages`, { method: 'GET' });
      const data = await response.json();

      const audioMessages = data.filter(message => message.attachments.length > 0 && message.attachments.filter(attachment => attachment.filename.endsWith(".ogg")).length > 0);
      if (audioMessages.length > 0) {
        audioFileUrl = audioMessages[0].attachments.filter(attachment => attachment.filename.endsWith(".ogg"))[0].url;
        messageLink = `https://discord.com/channels/${guild.id}/${audioMessages[0].channel_id}/${audioMessages[0].id}`;
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
    await DiscordRequest(`webhooks/${process.env.APP_ID}/${token}/messages/@original`,
      {
        method: 'PATCH',
        body: {
          // <link> causes embeds to not happen, which removes the huge box for Discord links
          content: `[Message](<${messageLink}>):\n${aiData.text}`,
        }
      }
    );
    return;
  }
}
);

app.listen(PORT, () => {
  console.log('Listening on port', PORT);
});
