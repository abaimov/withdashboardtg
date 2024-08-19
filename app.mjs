import 'dotenv/config'
import {PrismaClient} from '@prisma/client';

const prisma = new PrismaClient()
import {Bot, GrammyError, HttpError} from "grammy";

const bot = new Bot(process.env.TOKEN);

bot.command('start', async (ctx) => {
    try {
        const blockedUser = await prisma.blocked.findMany({
            where: {
                telegramId: String(ctx.from.id)
            }
        })
        if (blockedUser.length > 0) {
            await ctx.reply("УЖЕ В БЛОКЕ")
        } else {
            if (ctx.from.language_code !== "ru") {
                await ctx.reply("Страна не поддерживается")
                try {
                    await prisma.blocked.create({
                        data: {
                            telegramId: ctx.from.id.toString(),
                            language: ctx.from.language_code,
                            nickname: ctx.from.username
                        }
                    })
                } catch (e) {
                    console.log(`Не удалось заблокировать пользователя ID: ${telegramId},LANG:${language}`)
                }
            } else {
                try {
                    await prisma.user.create({
                        data: {
                            telegramId: ctx.from.id.toString(),
                            language: ctx.from.language_code,
                            nickname: ctx.from.username
                        }
                    })
                    await ctx.reply("Главный пост")
                } catch (e) {
                    console.log(`Не удалось добавить пользователя ID: ${telegramId},LANG:${language}`)
                }
            }
        }
    } catch (error) {
        console.error(`Ошибка при подключении к заблокированным пользователям`, error);
        if (error instanceof GrammyError) {
            console.error(`Ошибка Grammy: ${error.message}`, error);
        } else if (error instanceof HttpError) {
            console.error(`Ошибка HTTP: ${error.message}`, error);
        } else {
            console.error(`Неизвестная ошибка: ${error.message}`, error);
        }
    }
});
bot.start();
