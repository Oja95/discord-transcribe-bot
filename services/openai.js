import 'dotenv/config';
import { OpenAI } from 'openai';
import { getSystemPromptForStyle } from '../utils/summaryStyles.js';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Summarizes a block of Discord messages using OpenAI
 * @param {string} messagesText - The concatenated Discord messages
 * @param {string} styleKey - Key to retrieve the system prompt style
 * @returns {Promise<string>} - The generated summary from OpenAI
 */
export async function summarizeMessages(messagesText, styleKey) {
    const systemPromptStyle = getSystemPromptForStyle(styleKey);

    const systemMessage = `
You are an assistant that summarizes Discord discussions. You are basically like a caveman that must only use easy terms and phrases. ${systemPromptStyle}

Your entire summary response should not exceed 2000 characters.`.trim();

    const chatCompletion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
            {
                role: 'system',
                content: systemMessage,
            },
            {
                role: 'user',
                content: `Here are the last messages from the channel:\n\n${messagesText}`,
            },
        ],
    });

    return chatCompletion.choices[0].message.content;
}
