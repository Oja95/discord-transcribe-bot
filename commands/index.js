import 'dotenv/config';
import {InstallGlobalCommands} from '../services/discord.js';
import {getSlashCommandChoices} from '../utils/summaryStyles.js';

const TRANSCRIBE_LAST_AUDIO_MESSAGE_COMMAND = {
  name: 'what-did-you-say',
  description: 'Transcribe last voice message in the channel command (must be among last 50 messages)',
  type: 1
};

const TRANSCRIBE_AUDIO_MESSAGE_COMMAND = {
  name: 'what-did-you-say-id',
  description: 'Transcribe a voice message in this channel for the provided message identifier.',
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

const AUDIO_SUMMARY_COMMAND = {
name: 'audio-summary',
description: 'Fetches last n (default 50) messages, extracts all voice messages, transcribes in a single message.',
  type: 1,
  options: [
    {
      type: 4,
      name: 'limit',
      description: 'Amount of messages to look back. Default (1-100)'
    }
  ]
};

const TEXT_SUMMARY_COMMAND = {
  name: 'text-summary',
  description: 'Fetches last n (default 500) text messages, summarizes.',
  type: 1,
  options: [
    {
      type: 4,
      name: 'limit',
      description: 'Amount of messages to look back (max 1000).'
    },
    {
      name: 'style',
      description: 'Choose the summary format. Default bullet list.',
      type: 3, // STRING
      required: false,
      choices: getSlashCommandChoices(),
    }
  ]
};

const TRANSCRIBE_LAST_AUDIO_MESSAGE_COMMAND_ALIAS = { ...TRANSCRIBE_LAST_AUDIO_MESSAGE_COMMAND, name: 'uwotm8' }

export const ALL_COMMANDS = [AUDIO_SUMMARY_COMMAND, TRANSCRIBE_LAST_AUDIO_MESSAGE_COMMAND, TRANSCRIBE_AUDIO_MESSAGE_COMMAND, TRANSCRIBE_LAST_AUDIO_MESSAGE_COMMAND_ALIAS, TEXT_SUMMARY_COMMAND];

InstallGlobalCommands(process.env.APP_ID, ALL_COMMANDS);