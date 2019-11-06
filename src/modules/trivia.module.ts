import { BotModule } from "../types"
import { ClientUser, User, Message, MessageReaction, 
    PartialMessage, TextChannel, DMChannel, Client } from "discord.js"
import axios from "axios"

const reactionNumbers: string[] = ["\u0030\u20E3","\u0031\u20E3","\u0032\u20E3",
    "\u0033\u20E3","\u0034\u20E3","\u0035\u20E3", "\u0036\u20E3","\u0037\u20E3",
    "\u0038\u20E3","\u0039\u20E3"];
const timeToAnswer: number = 30000;

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
    return reactionNumbers.includes(reaction.emoji.name) && !(user instanceof ClientUser)
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

    const messageText: string = `__Category: ${categoryText}__\n> **${questionText}**\n` + 
        allAnswers.map((val, i) => `${i + 1}: ${val}`).join("\n")

    const sentMessage: Message = await channel.send(messageText)
    allAnswers.forEach(async (q, i) => {
        await sentMessage.react(reactionNumbers[i + 1])
    })
    
    const collector = sentMessage.createReactionCollector(reactionFilter, {time: timeToAnswer})
    collector.on("end", async collected => {
        const winners: User[] = []
        const losers: User[] = []
        collected.forEach((reaction, emoji) => {
            const index = reactionNumbers.indexOf(emoji) - 1
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