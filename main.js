'use strict';
const Telegraf = require('telegraf');
const Extra = require('telegraf/extra');

const FUNCTIONS = require('./modules/functions.js');
const { getQualityBy, setAnswer, replyFile, deleteUser, isInDatabase, mailing } = FUNCTIONS;

const CONSTANTS = require('./modules/config.js');
const { BOT_TOKEN, BOT_URL } = CONSTANTS;

const bot = new Telegraf(BOT_TOKEN);
bot.telegram.setWebhook(`${BOT_URL}/bot${BOT_TOKEN}`);
bot.startWebhook(`/bot${BOT_TOKEN}`, null, process.env.PORT);

let databaseByCity = [];
let databaseByCoords = [];
const cityRequested = new Set();

bot.command('start', ctx => replyFile(ctx, './texts/gretting.txt'));
bot.command('help', ctx => replyFile(ctx, './texts/manual.txt'));
bot.command('scale', ctx => replyFile(ctx, './texts/scale.txt'));

bot.command('subscribe', ctx => ctx.reply('Please, send location or city.',
  Extra.markup(markup =>
    markup.resize()
      .keyboard([
        markup.locationRequestButton('📍 Send location'),
        markup.button('🏙 Send city'),
      ])
      .oneTime()
  )));

bot.command('unsubscribe', ctx => {
  const id = ctx.message.chat.id;
  databaseByCity = deleteUser(databaseByCity, id);
  databaseByCoords = deleteUser(databaseByCoords, id);
  ctx.reply('By!');
});

bot.on('location', async ctx => {
  const lon = ctx.message.location.longitude;
  const lat = ctx.message.location.latitude;
  if (isInDatabase(databaseByCoords, ctx.message.chat.id)) {
    ctx.reply('You are already subscribed, write /unsubscribe and tell the new place');
  } else {
    databaseByCoords.push({ id: ctx.message.chat.id, lon, lat });
    const index = await getQualityBy('coords', lon, lat);
    ctx.reply(setAnswer(index));
  }https://github.com/zavad4/AirQualityBot
});

bot.hears('🏙 Send city', ctx => {
  cityRequested.add(ctx.message.chat.id);
  ctx.reply('Please, send your city in English');
});

bot.on('text', async ctx => {
  const id = ctx.message.chat.id;
  if (cityRequested.has(id)) {
    if (isInDatabase(databaseByCity, id)) {
      ctx.reply('You are already subscribed, write /unsubscribe and tell the new place');
    } else {
      const index = await getQualityBy('city', ctx.message.text);
      if (typeof index === 'number') {
        databaseByCity.push({ id, city: ctx.message.text });
        cityRequested.delete(id);
      }
      ctx.reply(setAnswer(index));
    }
  }
});

setInterval(() => mailing(bot, databaseByCity, databaseByCoords), 60000);
