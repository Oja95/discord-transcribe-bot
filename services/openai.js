import 'dotenv/config';
import { OpenAI } from 'openai';
import {getSystemPromptForStyle} from '../utils/summaryStyles.js';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Summarizes a block of Discord messages using OpenAI
 */
export async function summarizeMessages(messagesText, styleKey) {
    const systemPromptStyle = getSystemPromptForStyle(styleKey);

    const chatCompletion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
            {
                role: "system",
                content: `You are a helpful assistant that summarizes Discord discussions. ${systemPromptStyle}.`,
            },
            {
                role: "user",
                content: `Here are the last messages from the channel:\n\n${messagesText}`,
            },
        ],
    });

    return chatCompletion.choices[0].message.content;
}