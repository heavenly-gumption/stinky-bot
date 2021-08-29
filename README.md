# stinky-bot

A semi-declarative Discord bot written in TypeScript with Discord.js

## Installation and Running

* `npm install` - installs all packages
* `npm start` - runs the client
* `npm run build-ts` - builds the bot
* `npm run lint-ts` - runs the linter

## Bot Structure

All injection is done in `src/modules/index.ts`

Classes are banned by the linter.

### Modules

All functionality should be defined in a `src/modules/<module-name>.module.ts`. Each module should export one function with the following signature

```ts
export const ExampleModule = (client: Client, dependencies): void => { ... }
```

- `client`: the instance of the Discord Client that the bot is built on
- `dependencies`: an object containing all of the available services. For ease of use, parameter destructuring is recommended

```ts
export type ExampleModuleOptions = {
    exampleService: ExampleService
}

export const ExampeModule = (client: Client, { exampleService }: ExampleModuleOptions) => {
    // ...
    exampleService.helloWorld("i am here")
}
```

### Services

Services are located in `src/services`, and each service should be represented by a folder

Each service folder should have the following structure

|-src/services
  |-example
    |-example.service.ts
    |-index.ts
    |-type.ts

- `example.service.ts`: file describing the service
- `index.ts`: file exporting all contents of folder
- `type.ts`: file with relevant type definitions


## Credits

Shoutout to Shawn Wu for mentioning the module pattern in his primitive bot framework https://github.com/chudooder/pocket-gopher