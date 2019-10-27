# stinky-bot

A semi-declarative Discord bot written in TypeScript with Discord.js

## Installation and Running

* `npm install` - installs all packages
* `npm start` - runs the client
* `npm run build-ts` - builds the bot
* `npm run lint-ts` - runs the linter

## Bot Structure

All functionality should be defined in a `src/modules/<module-name>.module.ts`. Each module should export one function of type `BotModule`. Classes are banned by the linter.

## Credits

Shoutout to Nate DeBoer for maintaning my old and poorly written bot
Shoutout to Shawn Wu for mentioning the module pattern in his primitive bot framework https://github.com/chudooder/pocket-gopher