import OpenAI from "openai";
import { InteractionResponseType } from 'discord-interactions';
import {DiscordRequest} from '../services/discord.js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function handleTextSummaryCommand(data, channel_id, res) {
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

  try {
    const summaryRes = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that summarizes Discord conversations.",
        },
        {
          role: "user",
          content: `Summarize the following Discord messages:\n\n${textMessages}`,
        },
      ],
    });

    const summary = summaryRes.choices[0].message.content;

    res.send({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: { content: summary },
    });
  } catch (err) {
    console.error("OpenAI API error:", err);
    res.send({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: { content: `Something went wrong while generating the summary.` },
    });
  }
}