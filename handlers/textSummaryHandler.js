import { InteractionResponseType } from 'discord-interactions';
import { DiscordRequest } from '../services/discord.js';
import { summarizeMessages } from '../services/openai.js';
import { checkRateLimit } from '../utils/rateLimiter.js';

const MAX_INPUT_CHARACTERS = 16000;

export async function handleTextSummaryCommand(data, channel_id, body, res) {
  const { token, member, user } = body;
  const userId = member?.user?.id || user?.id;
  const limit = Math.min(data?.options?.[0]?.value || 100, 500); // Clamp to 500

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
    console.log('Input preview:\n' + textMessages.slice(0, 5000));
    console.log(`---[truncated if long]---`);
    console.log(`================= OPENAI REQUEST END ===================\n`);

    const summary = await summarizeMessages(textMessages);

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

  while (allMessages.length < totalLimit) {
    const fetchLimit = Math.min(100, totalLimit - allMessages.length);
    const endpoint = `channels/${channelId}/messages?limit=${fetchLimit}` +
        (beforeId ? `&before=${beforeId}` : '');

    const response = await DiscordRequest(endpoint, { method: 'GET' });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Failed to fetch messages: ${response.status} - ${err}`);
    }

    const messages = await response.json();
    if (messages.length === 0) break;

    allMessages.push(...messages);
    beforeId = messages[messages.length - 1].id;
  }

  return allMessages;
}
