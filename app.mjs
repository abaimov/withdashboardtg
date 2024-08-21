import {Bot} from "grammy";
import {PrismaClient} from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();
const prisma = new PrismaClient();
const bot = new Bot(process.env.TOKEN);


let usersBuffer = [];
let blockedUsersBuffer = [];

const REGION = "ru"
const BATCH_SIZE = 5;


async function saveUsersToDatabase() {
    if (usersBuffer.length >= BATCH_SIZE) {
        try {
            await prisma.user.createMany({
                data: usersBuffer
            });
            console.log(`${usersBuffer.length} пользователей добавлены в базу данных.`);
            usersBuffer = [];  // Очистка массива после успешной вставки
        } catch (error) {
            console.error(`Ошибка при массовом добавлении пользователей: ${error.message}`, error);
        }
    }
}

async function blockUsersInDatabase() {
    if (blockedUsersBuffer.length >= BATCH_SIZE) {
        try {
            await prisma.blocked.createMany({
                data: blockedUsersBuffer
            });
            console.log(`${blockedUsersBuffer.length} пользователей заблокированы в базе данных.`);
            blockedUsersBuffer = [];  // Очистка массива после успешной вставки
        } catch (error) {
            console.error(`Ошибка при массовом блокировании пользователей: ${error.message}`, error);
        }
    }
}

function parseMessageTime(ctx) {

    const timestamp = ctx.message.date;
    const date = new Date(timestamp * 1000);

    // Преобразуем дату в строку нужного формата
    const formattedDate = date.toLocaleString('ru-RU', {
        timeZone: 'Europe/Moscow',
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
    });

    return formattedDate;
}

bot.on("message", async (ctx) => {
    console.log(ctx.from.username);
    if(ctx.message.text==="/start"){
        const LOCATION = ctx.from.language_code || "unknown";
        console.log(LOCATION);
        const user = {
            telegramId: String(ctx.from.id),
            language: LOCATION,
            nickname: ctx.from.username || "",
            time: parseMessageTime(ctx),
        };
        if (LOCATION === REGION) {
            usersBuffer.push(user);
            // console.log(usersBuffer.length, "user");
            await saveUsersToDatabase();
            await ctx.reply("ТЕКСТ ДЛЯ ПОЛЬЗОВАТЕЛЯ 😁")

        } else {
            blockedUsersBuffer.push(user);
            // console.log(blockedUsersBuffer.length, "block");
            await blockUsersInDatabase();
        }
    }

});

bot.start().catch((err) => {
    console.error(`Ошибка при выполнении бота: ${err.message}`, err);
});


process.on('SIGINT', async () => {
    console.log("Завершение работы...");
    try {
        await saveUsersToDatabase();
        await blockUsersInDatabase();
    } catch (error) {
        console.error(`Ошибка при завершении работы: ${error.message}`, error);
    } finally {
        await prisma.$disconnect();
        process.exit(0);
    }
});

process.on('SIGTERM', async () => {
    console.log("Завершение работы...");
    try {
        await saveUsersToDatabase();
        await blockUsersInDatabase();
    } catch (error) {
        console.error(`Ошибка при завершении работы: ${error.message}`, error);
    } finally {
        await prisma.$disconnect();
        process.exit(0);
    }
});

