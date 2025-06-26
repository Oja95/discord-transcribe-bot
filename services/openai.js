import 'dotenv/config';
import { OpenAI } from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Summarizes a block of Discord messages using OpenAI
 */
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