import { BotModule } from "../types"
import { ClientUser, User, Message, MessageReaction, 
    PartialMessage, TextChannel, DMChannel, Client } from "discord.js"
import axios from "axios"

const REACTION_NUMBERS: string[] = ["\u0031\u20E3","\u0032\u20E3","\u0033\u20E3","\u0034\u20E3"]
const TIME_TO_ANSWER: number = 30000
const EDIT_INTERVAL: number = 2000
const PROGRESS_BAR_LENGTH: number = 30
const PROGRESS_BAR_LANGUAGES: string[] = ["css", "ini", ""]

type TriviaQuestion = {
    question: string;
    category: string;
    difficulty: string;
    incorrect_answers: string[];
    correct_answer: string;
    type: string;
};

function shuffle(arr: any[]): any[] {
    const clone: any[] = [...arr]
    for (let i = clone.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [clone[i], clone[j]] = [clone[j], clone[i]]
    }
    return clone
}

function reactionFilter(reaction: MessageReaction, user: User): boolean {
    return REACTION_NUMBERS.includes(reaction.emoji.name) && !(user instanceof ClientUser)
}

function getProgressBar(startTime: number, currentTime: number, totalTime: number): string {
    const progress: number = Math.max(0.0, 1.0 - ((currentTime - startTime) / totalTime));
    const numEquals: number = Math.floor(PROGRESS_BAR_LENGTH * progress);
    const numDash: number = PROGRESS_BAR_LENGTH - numEquals;
    const language: string = PROGRESS_BAR_LANGUAGES[Math.floor(progress * PROGRESS_BAR_LANGUAGES.length)];
    return `\`\`\`${language}\n[${"=".repeat(numEquals)}${"-".repeat(numDash)}]\n\`\`\``
}

async function handleTrivia(channel: TextChannel | DMChannel): Promise<void> {
    const trivia = await axios.get("https://opentdb.com/api.php?amount=1&type=multiple&encode=url3986")
    const question: TriviaQuestion = trivia.data.results[0]
    const categoryText: string = decodeURIComponent(question.category)
    const questionText: string = decodeURIComponent(question.question)
    const correctAnswer: string = decodeURIComponent(question.correct_answer)
    const allAnswers: string[] = shuffle(question.incorrect_answers.concat([question.correct_answer]))
        .map(s => decodeURIComponent(s))
    const correctIndex: number = allAnswers.indexOf(correctAnswer)
    const startTime: number = Date.now()

    const messageText: string = `__Category: ${categoryText}__\n> **${questionText}**\n` + 
        allAnswers.map((val, i) => `${i + 1}: ${val}`).join("\n")
        
    // Send the message
    const sentMessage: Message = await channel.send(messageText + 
        "\n" + getProgressBar(startTime, Date.now(), TIME_TO_ANSWER))

    // Start an edit timer; every 2000ms, edit the message with a refreshed progress bar.
    const interval = setInterval(() => {
        sentMessage.edit(messageText + 
            "\n" + getProgressBar(startTime, Date.now(), TIME_TO_ANSWER))
    }, EDIT_INTERVAL)

    // React to the message with [1], [2], [3], [4] in order
    allAnswers.forEach(async (q, i) => {
        await sentMessage.react(REACTION_NUMBERS[i])
    })

    // Collect reactions
    const collector = sentMessage.createReactionCollector(reactionFilter, {time: TIME_TO_ANSWER})
    collector.on("end", async collected => {
        // Stop editing the message
        clearInterval(interval)

        // Remove the progress bar from the message with one last edit. No need to await
        sentMessage.edit(messageText)

        // Determine winners and losers, and print them
        const winners: User[] = []
        const losers: User[] = []
        collected.forEach((reaction, emoji) => {
            const index = REACTION_NUMBERS.indexOf(emoji);
            if (index === correctIndex) {
                reaction.users.filter(u => !(u instanceof ClientUser))
                    .forEach(u => winners.push(u))
            } else {
                reaction.users.filter(u => !(u instanceof ClientUser))
                    .forEach(u => losers.push(u))
            }
        })

        const cheaters: User[] = winners.filter(u => losers.includes(u))
        const realWinners: User[] = winners.filter(u => !cheaters.includes(u))
        await channel.send(`The correct answer was: **${correctAnswer}**`)
        if (realWinners.length > 0) {
            const winnerList: string = realWinners.map(u => `<@${u.id}>`).join(", ")
            await channel.send(`These people got it right: ${winnerList}`)
        } else {
            await channel.send("Nobody got it right!")
        }
        if (cheaters.length > 0) {
            const cheaterList: string = cheaters.map(u => `<@${u.id}>`).join(", ")
            await channel.send(`These cheaters answered multiple times: ${cheaterList}`)
        }
    })
}


export const TriviaModule: BotModule = (client: Client) => {
    console.log("Loaded TriviaModule")
    client.on("message", async message => {
        if (message.content && message.channel && message.content.startsWith("!trivia")) {
            await handleTrivia(message.channel)
        }
    })
}