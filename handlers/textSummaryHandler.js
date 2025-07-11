import { InteractionResponseType } from 'discord-interactions';
import { DiscordRequest } from '../services/discord.js';
import { summarizeMessages } from '../services/openai.js';
import { checkRateLimit } from '../utils/rateLimiter.js';

const MAX_INPUT_CHARACTERS = 32000;
const MAX_RETRIES = 5;

export async function handleTextSummaryCommand(data, channel_id, body, res) {
  const { token, member, user } = body;
  const userId = member?.user?.id || user?.id;
  const limit = Math.min(data?.options?.[0]?.value || 500, 1000); // Clamp to 1000

  // Rate limit check
  const rateStatus = checkRateLimit(userId, channel_id);
  if (!rateStatus.allowed) {
    return res.send({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: `⏳ ${rateStatus.reason}`,
        flags: 64
      }
    });
  }

  res.send({
    type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      content: `Fetching last ${limit} messages, please wait...`,
    },
  });

  try {
    const messages = await fetchChannelMessages(channel_id, limit);
    const messageLines = messages
        .filter(m => m.content && !m.author.bot)
        .reverse()
        .map(m => `${m.author.username}: ${m.content}`);

    let wasTrimmed = false;
    let textMessages = messageLines.join('\n');

    if (textMessages.length > MAX_INPUT_CHARACTERS) {
      wasTrimmed = true;
      while (textMessages.length > MAX_INPUT_CHARACTERS) {
        messageLines.shift(); // remove oldest message
        textMessages = messageLines.join('\n');
      }
    }

    if (!textMessages) {
      await DiscordRequest(`webhooks/${process.env.APP_ID}/${token}/messages/@original`, {
        method: 'PATCH',
        body: {
          content: `⚠️ No suitable text messages found to summarize.`,
        },
      });
      return;
    }

    console.log(`\n================= OPENAI REQUEST START =================`);
    console.log(`Timestamp: ${new Date().toISOString()}`);
    console.log(`User ID: ${userId}`);
    console.log(`Channel ID: ${channel_id}`);
    console.log(`Messages: ${messages.length}`);
    if (wasTrimmed) console.log(`⚠️ Input was trimmed to ${MAX_INPUT_CHARACTERS} characters`);
    console.log('Input preview:\n' + textMessages.slice(0, 500));
    console.log(`---[truncated if long]---`);
    console.log(`================= OPENAI REQUEST END ===================\n`);

    const styleKey = data?.options?.find(opt => opt.name === 'style')?.value || 'professional';
    const summary = await summarizeMessages(textMessages, styleKey);

    const contentToSend = wasTrimmed
        ? `⚠️ Only the most recent messages (under ${MAX_INPUT_CHARACTERS} characters) were included.\n\n${summary}`
        : summary;

    await DiscordRequest(`webhooks/${process.env.APP_ID}/${token}/messages/@original`, {
      method: 'PATCH',
      body: { content: contentToSend },
    });
  } catch (err) {
    console.error('Text summary failed:', err);
    await DiscordRequest(`webhooks/${process.env.APP_ID}/${token}/messages/@original`, {
      method: 'PATCH',
      body: {
        content: `❌ Something went wrong while summarizing the messages.`,
      },
    });
  }
}

async function fetchChannelMessages(channelId, totalLimit) {
  let allMessages = [];
  let beforeId = null;
  let retries = 0;

  while (allMessages.length < totalLimit) {
    const fetchLimit = Math.min(100, totalLimit - allMessages.length);
    const endpoint = `channels/${channelId}/messages?limit=${fetchLimit}` +
        (beforeId ? `&before=${beforeId}` : '');

    const response = await DiscordRequest(endpoint, { method: 'GET' });

    if (response.status === 429) {
      console.log(`Rate limit exceeded, retry attempt number ${retries + 1}`);
      if (retries >= MAX_RETRIES) throw new Error("Too many rate limit retries for Discord API!");
      retries++;

      const data = await response.json();
      const retryAfter = data.retry_after || 100; // milliseconds
      console.warn(`Response data: ${JSON.stringify(data)}`);
      console.warn(`⚠️ Rate limited by Discord. Retrying in ${retryAfter}ms...`);
      await wait(retryAfter);
      continue; // Retry same request
    }

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Failed to fetch messages: ${response.status} - ${err}`);
    }
    console.log(`Discord message request response: ${response.status}`);

    const messages = await response.json();
    if (messages.length === 0) break;

    allMessages.push(...messages);
    beforeId = messages[messages.length - 1].id;

    await wait(50); // 50ms between requests
  }

  return allMessages;
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}