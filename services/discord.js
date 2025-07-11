import 'dotenv/config';
import fetch from 'node-fetch';
import { verifyKey } from 'discord-interactions';

/**
 * Verifies that the request came from Discord
 */
export function VerifyDiscordRequest(clientKey) {
    return function (req, res, buf) {
        const signature = req.get('X-Signature-Ed25519');
        const timestamp = req.get('X-Signature-Timestamp');

        const isValidRequest = verifyKey(buf, signature, timestamp, clientKey);
        if (!isValidRequest) {
            res.status(401).send('Bad request signature');
            throw new Error('Bad request signature');
        }
    };
}

/**
 * Makes a request to the Discord API
 */
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
        console.error(`Discord API Error (${res.status}) at endpoint ${endpoint}`);
    }

    return res;
}

/**
 * Registers or updates global slash commands
 */
export async function InstallGlobalCommands(appId, commands) {
    const endpoint = `applications/${appId}/commands`;

    try {
        await DiscordRequest(endpoint, { method: 'PUT', body: commands });
        console.log("Global commands register initiated.");
    } catch (err) {
        console.error('Failed to install global commands:', err);
    }
}