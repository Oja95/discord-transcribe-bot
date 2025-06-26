import { InteractionResponseType, InteractionType } from 'discord-interactions';
import { handleTextSummaryCommand } from '../handlers/textSummaryHandler.js';
import { handleAudioTranscriptionCommand } from '../handlers/audioTranscribeHandler.js';

export async function handleInteraction(req, res) {
  const { type, data, channel_id } = req.body;

  if (type === InteractionType.PING) {
    return res.send({ type: InteractionResponseType.PONG });
  }

  if (type === InteractionType.APPLICATION_COMMAND) {
    const { name } = data;

    if (name === 'text-summary') {
      await handleTextSummaryCommand(data, channel_id, res);
    } else {
      await handleAudioTranscriptionCommand(name, data, channel_id, req.body, res);
    }

    return;
  }

  // Fallback for unsupported types
  res.status(400).send("Unsupported interaction type");
}