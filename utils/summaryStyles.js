// utils/summaryStyles.js

export const SUMMARY_STYLE_OPTIONS = {
    bullet: {
        label: "Bullet Points",
        prompt: "The output should be a bullet point list.",
    },
    tldr: {
        label: "TL;DR",
        prompt: "Summarize the conversation in 1-2 short TL;DR style lines.",
    },
    roast: {
        label: "Roast",
        prompt: "Use emojis. Pick out the main participants from key conversations, quote the cringe-worthy messages that they sent and roast them for it."
    },
    zoomer: {
        label: "Zoomer",
        prompt: "Summarize the conversation while freely using Gen Z vocabulary.",
    }
};

// Helper: convert to Discord choices for command registration
export function getSlashCommandChoices() {
    return Object.entries(SUMMARY_STYLE_OPTIONS).map(([value, { label }]) => ({
        name: label,
        value,
    }));
}

// Helper: safely resolve style key to system prompt
export function getSystemPromptForStyle(styleKey) {
    return (
        SUMMARY_STYLE_OPTIONS[styleKey]?.prompt ||
        SUMMARY_STYLE_OPTIONS.bullet.prompt
    );
}
