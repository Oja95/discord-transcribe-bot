import { InteractionResponseType } from 'discord-interactions';
import {DiscordRequest} from '../services/discord.js';
import {summarizeMessages} from '../services/openai.js';

export async function handleTextSummaryCommand(data, channel_id, body, res) {
  const { token } = body;
  const limit = data?.options?.[0]?.value || 100;

  const discordResponse = await DiscordRequest(`channels/${channel_id}/messages?limit=${limit}`, {
    method: 'GET',
  });

  if (!discordResponse.ok) {
    res.send({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: { content: `Failed to fetch messages from channel.` },
    });
    return;
  }

  const messages = await discordResponse.json();

  const textMessages = messages
      .filter(m => m.content && !m.author.bot)
      .reverse()
      .map(m => `${m.author.username}: ${m.content}`)
      .join('\n');

  if (!textMessages) {
    res.send({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: { content: `No suitable messages to summarize.` },
    });
    return;
  }

  res.send({
    type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      content: `Found message(s), processing.`
    },
  });

  try {
    const summary = await summarizeMessages(textMessages);

    await DiscordRequest(`webhooks/${process.env.APP_ID}/${token}/messages/@original`, {
      method: 'PATCH',
      body: { content: summary },
    });
  } catch (err) {
    console.error('OpenAI error:', err);
    await DiscordRequest(`webhooks/${process.env.APP_ID}/${token}/messages/@original`, {
      method: 'PATCH',
      body: {
        content: `❌ Something went wrong while generating the summary.`,
      },
    });
  }
}