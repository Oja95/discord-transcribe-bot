# Audio message transcriber Discord bot
This project contains a basic Discord app written in JavaScript, built base on the [getting started guide](https://discord.com/developers/docs/getting-started). It's goal is to obtain the latest (or specified) message that contains an audio recording attachment, send it to speech recongition AI and return the transcribed result back to Discord.

## Project structure
Below is a basic overview of the project structure:

```
├── .env                        # Environment variables (e.g., tokens, API keys)
├── app.js                      # Express entrypoint and interaction route registration
├── routes/
│   └── interactionsRouter.js   # Main Discord interactions handler (slash command router)
├── handlers/
│   ├── audioTranscribeHandler.js  # Handles audio transcription commands via DeepInfra
│   └── textSummaryHandler.js      # Handles text message summarization using OpenAI
├── commands/
│   └── index.js                # Slash command definitions (e.g. text-summary, uwotm8)
├── utils/
│   ├── discord.js              # Discord API utilities (request wrapper, signature verification, etc.)
│   ├── deepinfra.js            # DeepInfra integration for audio transcription
│   └── openai.js               # OpenAI integration for text summarization
├── package.json
├── README.md
└── .gitignore
```

## Running app locally

Before you start, you'll need to install [NodeJS](https://nodejs.org/en/download/) and [create a Discord app](https://discord.com/developers/applications) with the proper permissions:
- `applications.commands`
- `bot` (with Send Messages & Read messages & Read chat history enabled)

Configuring the app is covered in detail in the [getting started guide](https://discord.com/developers/docs/getting-started).

### Setup project

First clone the project:
```
git clone git@github.com:Oja95/discord-transcribe-bot.git
```

Then navigate to its directory and install dependencies:
```
cd discord-transcribe-bot
npm install
```

### Get app credentials

Fetch the credentials from your app's settings and add them to a `.env` file (see `.env.sample` for an example). You'll need your app ID (`APP_ID`), bot token (`DISCORD_TOKEN`), and public key (`PUBLIC_KEY`).
Fetching Discord credentials is covered in detail in the [getting started guide](https://discord.com/developers/docs/getting-started).

It is also possible to configure custom listening port for the HTTP server by setting the `PORT` environment attribute.

Additionally, this bot implementation relies on the [DeepInfra Automatic Speech Recognition AI model](https://deepinfra.com/openai/whisper-large/api), communicating it via API. One must configure `DEEPINFRA_API_KEY` token obtained from the said site.


### Install slash commands

The commands for the example app are set up in `index.js`. All of the commands in the `ALL_COMMANDS` array at the bottom of `index.js` will be installed when you run the `register` command configured in `package.json`:

```
npm run register
```

### Commands
This bot defines two commands:
* `/what-did-you-say` - Fetches the last 50 messages sent in the channel where the command was invoked and looks up the latest message with voice message attachments. 
* `/what-did-you-say-id <messageid>` - Fetches the messsage with provided message identifier and assumes it has voice message attachment

### Run the app

After your credentials are added, go ahead and run the app:

```
node app.js
```

> ⚙️ A package [like `nodemon`](https://github.com/remy/nodemon), which watches for local changes and restarts your app, may be helpful while locally developing.

## Other resources
- Read **[the documentation](https://discord.com/developers/docs/intro)** for in-depth information about API features.
- Browse the `examples/` folder in this project for smaller, feature-specific code examples
- Join the **[Discord Developers server](https://discord.gg/discord-developers)** to ask questions about the API, attend events hosted by the Discord API team, and interact with other devs.
- Check out **[community resources](https://discord.com/developers/docs/topics/community-resources#community-resources)** for language-specific tools maintained by community members.
