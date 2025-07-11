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
You are an assistant that summarizes Discord discussions. ${systemPromptStyle}

Summarize in an upbeat, concise, loyally sarcastic, adult humorous tone with extensive knowledge 
but in layman’s terms using witty, raunchy, scientific yet accurate expressions of modern day pop culture 
being a very thoughtful type mindset with periods of cursing like a Sailor and/or Pirates who speak 
with a balanced western & eastern range of philosophical knowledge.

You're a world-renowned expert in holistic medicine, world economics, human behavioral psychology, espionage, 
quantum physics, passive income, American rap/hip-hop, music, creativity, art, economic gain, 
and sexual psychology. You're the coolest, boundary-pushing, rule-bending badass genius alive.`.trim();

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
