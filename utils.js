import 'dotenv/config';
import fetch from 'node-fetch';
import { verifyKey } from 'discord-interactions';
import streamToBlob from 'stream-to-blob';
import {OpenAI} from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export function VerifyDiscordRequest(clientKey) {
  return function (req, res, buf, encoding) {
    const signature = req.get('X-Signature-Ed25519');
    const timestamp = req.get('X-Signature-Timestamp');

    const isValidRequest = verifyKey(buf, signature, timestamp, clientKey);
    if (!isValidRequest) {
      res.status(401).send('Bad request signature');
      throw new Error('Bad request signature');
    }
  };
}

export async function DiscordRequest(endpoint, options) {
  const url = `https://discord.com/api/v10/${endpoint}`;

  if (options.body) options.body = JSON.stringify(options.body);

  const res = await fetch(url, {
    headers: {
      Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
      'Content-Type': 'application/json; charset=UTF-8',
      'User-Agent': 'DiscordBot',
    },
    ...options
  });

  if (!res.ok) {
    const data = await res.json();
    console.log(res.status);
    console.error(JSON.stringify(data));
  } 

  return res;
}

export async function DeepInfraRequest(attachmentUrl) {
  const url = 'https://api.deepinfra.com/v1/inference/openai/whisper-large';
  
  // Download the audio file
  const audioFileResponse = await fetch(attachmentUrl);

  if (!audioFileResponse.ok) {
    console.error('Error downloading audio file: ', audioFileResponse.statusText);
    return;
  }

  // Convert the audio file response stream into a blob 
  const audioBlob = await streamToBlob(audioFileResponse.body);

  // Create a new FormData object
  const formData = new FormData();

  // Append the downloaded audio file to the FormData object
  formData.append('audio', audioBlob, {
    filename: 'voice.ogg',
    contentType: audioFileResponse.headers.get('content-type'),
  });

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `bearer ${process.env.DEEPINFRA_API_KEY}`,
    },
    body: formData
  });

  if (!res.ok) {
    const data = await res.json();
    console.error(res.status);
    console.error(JSON.stringify(data));
  } 

  return res;
}

export async function summarizeMessages(messagesText) {
  const chatCompletion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: "You are a helpful assistant that summarizes Discord discussions.",
      },
      {
        role: "user",
        content: `Here are the last messages from the channel:\n\n${messagesText}`,
      },
    ],
  });

  return chatCompletion.choices[0].message.content;
}

export async function InstallGlobalCommands(appId, commands) {
  // API endpoint to overwrite global commands
  const endpoint = `applications/${appId}/commands`;

  try {
    // This is calling the bulk overwrite endpoint: https://discord.com/developers/docs/interactions/application-commands#bulk-overwrite-global-application-commands
    await DiscordRequest(endpoint, { method: 'PUT', body: commands });
  } catch (err) {
    console.error(err);
  }
}