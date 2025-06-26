import { InteractionResponseType } from 'discord-interactions';
import {DiscordRequest} from '../services/discord.js';
import {DeepInfraRequest} from '../services/deepinfra.js';

export async function handleAudioTranscriptionCommand(name, data, channel_id, body, res) {
  const { token } = body;
  let audioFileUrls = [];
  let messageId = data?.options?.[0]?.value;
  let messageLink;

  if (name === 'what-did-you-say-id' && messageId) {
    const re = /https?:\/\/discord.com\/channels\/\d+\/\d+\/(\d+)/;
    const match = messageId.match(re);
    if (match?.[1]) {
      messageLink = messageId;
      messageId = match[1];
    }

    const response = await DiscordRequest(`channels/${channel_id}/messages/${messageId}`, { method: 'GET' });

    if (!response.ok) {
      res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: { content: `Failed to fetch channel message with ID ${messageId}!` },
      });
      return;
    }

    const message = await response.json();
    const audio = message.attachments.find(a => a.filename.endsWith(".ogg"));
    if (!audio) {
      res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: { content: `No audio file found with ID ${messageId}` },
      });
      return;
    }

    audioFileUrls.push(audio.url);
  }

  else {
    // default fetch last 50 messages
    const response = await DiscordRequest(`channels/${channel_id}/messages?limit=50`, { method: 'GET' });
    const messages = await response.json();
    const audioMessages = messages
        .filter(msg => msg.attachments.some(a => a.filename.endsWith(".ogg")));

    if (audioMessages.length === 0) {
      res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: { content: `Found no audio file to process in the last 50 messages.` },
      });
      return;
    }

    audioFileUrls.push(audioMessages[0].attachments.find(a => a.filename.endsWith(".ogg")).url);
  }

  res.send({
    type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      content: `Found voice message(s), processing.`
    },
  });

  const transcriptionResults = await Promise.all(audioFileUrls.map(async url => {
    const aiResponse = await DeepInfraRequest(url);
    const aiData = await aiResponse.json();
    return aiData.text;
  }));

  const responseText = transcriptionResults.join('\n\n');
  console.log(`Transcription result: ${responseText}`);

  await DiscordRequest(`webhooks/${process.env.APP_ID}/${token}/messages/@original`, {
    method: 'PATCH',
    body: { content: responseText },
  });
}