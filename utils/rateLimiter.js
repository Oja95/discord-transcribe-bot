const userTimestamps = new Map();      // userId => timestamp
const channelCounters = new Map();     // channelId => { count, resetAt }

export function checkRateLimit(userId, channelId) {
    const now = Date.now();
    const userCooldown = 60 * 60 * 1000; // 1 hour
    const channelWindow = 60 * 60 * 1000; // 1 hour
    const maxChannelUses = 3;

    // --- Check user cooldown ---
    const lastUsed = userTimestamps.get(userId);
    if (lastUsed && now - lastUsed < userCooldown) {
        return { allowed: false, reason: "You're using this too frequently. Try again later." };
    }

    // --- Check channel quota ---
    const channelData = channelCounters.get(channelId) || { count: 0, resetAt: now + channelWindow };

    if (now > channelData.resetAt) {
        channelData.count = 0;
        channelData.resetAt = now + channelWindow;
    }

    if (channelData.count >= maxChannelUses) {
        return { allowed: false, reason: "Too many summaries requested in this channel recently. Try again later." };
    }

    // Passed checks
    userTimestamps.set(userId, now);
    channelData.count += 1;
    channelCounters.set(channelId, channelData);

    return { allowed: true };
}