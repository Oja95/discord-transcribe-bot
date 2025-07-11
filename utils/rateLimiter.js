const userRequestLogs = new Map();      // userId => [timestamps]
const channelCounters = new Map();      // channelId => { count, resetAt }

const USER_LIMIT = 3;
const CHANNEL_LIMIT = 10;
const WINDOW_MS = 60 * 60 * 1000; // 1 hour

export function checkRateLimit(userId, channelId) {
    const now = Date.now();

    // --- User-specific rate limiting (3 per hour) ---
    if (!userRequestLogs.has(userId)) {
        userRequestLogs.set(userId, []);
    }

    const recentUserTimestamps = userRequestLogs.get(userId).filter(ts => now - ts < WINDOW_MS);
    userRequestLogs.set(userId, recentUserTimestamps); // prune old

    if (recentUserTimestamps.length >= USER_LIMIT) {
        return {
            allowed: false,
            reason: `You've hit the limit of ${USER_LIMIT} requests per hour. Try again later.`,
        };
    }

    // --- Channel-specific rate limiting (10 per hour) ---
    const channelData = channelCounters.get(channelId) || { count: 0, resetAt: now + WINDOW_MS };

    if (now > channelData.resetAt) {
        channelData.count = 0;
        channelData.resetAt = now + WINDOW_MS;
    }

    if (channelData.count >= CHANNEL_LIMIT) {
        return {
            allowed: false,
            reason: `Too many requests in this channel (max ${CHANNEL_LIMIT} per hour). Try again later.`,
        };
    }

    // ✅ Passed both checks: record usage
    recentUserTimestamps.push(now);
    userRequestLogs.set(userId, recentUserTimestamps);

    channelData.count += 1;
    channelCounters.set(channelId, channelData);

    return { allowed: true };
}