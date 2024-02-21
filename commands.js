import 'dotenv/config';
import { InstallGlobalCommands } from './utils.js';

const TRANSCRIBE_LAST_AUDIO_MESSAGE_COMMAND = {
  name: 'what-did-you-say',
  description: 'Transcribe last voice message in the channel command (must be among last 50 messages)',
  type: 1
};

// Command containing options
const TRANSCRIBE_AUDIO_MESSAGE_COMMAND = {
  name: 'what-did-you-say-id',
  description: 'Transcribe a voice message in this channel for the provided message identifier',
  type: 1,
  options: [
    {
      type: 3,
      name: 'messageid',
      description: 'Message identifier',
      required: true
    }
  ]
};

const ALL_COMMANDS = [TRANSCRIBE_LAST_AUDIO_MESSAGE_COMMAND, TRANSCRIBE_AUDIO_MESSAGE_COMMAND];

InstallGlobalCommands(process.env.APP_ID, ALL_COMMANDS);