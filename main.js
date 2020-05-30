'use strict';
const Telegraf = require('telegraf');
const Extra = require('telegraf/extra');
const request = require('request');
const CONSTANTS = require('./config.js');
const { BOT_TOKEN, API_TOKEN, API_URL, CORRECT_HOUR, CORRECT_MINUTES } = CONSTANTS;

const bot = new Telegraf(BOT_TOKEN);
const token = API_TOKEN;

let databaseByCity = [];
let databaseByCoords = [];
const cityRequested = new Set();
let currentHour = 0;
let currentMinute = 0;

async function getQualityBy(type, ...args) {
  let params = '';
  if (type === 'city') params = args[0];
  else if (type === 'coords') params = `geo:${args[1]};${args[0]}`;
  const options = {
    method: 'GET',
    url: API_URL + `${params}/?token=${token}`,
  };
  let res;
  await new Promise((resolve, reject) => {
    request(options, (error, response, body) => {
      if (error) {
        reject(error);
      } else {
        resolve(JSON.parse(body));
      }
    });
  })
    .then(data => {
      res = data.data.aqi;
    })
    .catch(err => {
      res = 'impossible to determine';
      console.log(err);
    });
  return res;
}

const sendQualityBy = type => async user => {
  let index = 0;
  if (type === 'city') index = await getQualityBy('city', user.city);
  else if (type === 'coords') index = await getQualityBy('coords', user.lon, user.lat);
  if (typeof index === 'number') {
    bot.telegram.sendMessage(user.id, `Good morning! AQI of your place is ${index}`);
  }
};

const setAnswer = index => {
  let answer;
  if (typeof index === 'number') {
    answer = `Okey, I'll send you air quality index of this place every day. Now it is ${index}.`;
  } else answer = 'It is impossible to determine. Please, enter city.';
  return answer;
};

const deleteUser = (database, id) => {
  database = database.filter(user => user.id !== id);
  console.log(database);
};

let arr = [{ id: 1 }, { id: 2 }, { id: 1 }, { id: 3 }];
deleteUser(arr, 1);

const mailing = () => {
  console.log(new Date().getUTCHours() + ':' + new Date().getUTCMinutes());
  currentHour = new Date().getUTCHours();
  currentMinute = new Date().getUTCMinutes();
  if (currentHour === CORRECT_HOUR && currentMinute === CORRECT_MINUTES) {
    databaseByCity.forEach(sendQualityBy('city'));
    databaseByCoords.forEach(sendQualityBy('coords'));
  }
};

bot.command('start', ctx => ctx.reply('Please location or city', Extra.markup(markup =>
  markup.resize()
    .keyboard([
      markup.locationRequestButton('📍 Send location'),
      markup.button('🏙 Send city'),
    ])
    .oneTime()
)));

bot.command('unsubscribe', ctx => {
  const id = ctx.message.chat.id;
  console.log(id);
  deleteUser(databaseByCity, id);
  deleteUser(databaseByCoords, id);
  console.log(databaseByCity);
  console.log(databaseByCoords);
  ctx.reply('By!');
});

bot.on('location', async ctx => {
  const lon = ctx.message.location.longitude;
  const lat = ctx.message.location.latitude;
  databaseByCoords.push({ id: ctx.message.chat.id, lon, lat });
  console.log(databaseByCoords);
  const index = await getQualityBy('coords', lon, lat);
  ctx.reply(setAnswer(index));
});

bot.hears('🏙 Send city', ctx => {
  cityRequested.add(ctx.message.chat.id);
  ctx.reply('Please, send your city in English');
});

bot.on('text', async ctx => {
  if (cityRequested.has(ctx.message.chat.id)) {
    const index = await getQualityBy('city', ctx.message.text);
    if (typeof index === 'number') {
      databaseByCity.push({ id: ctx.message.chat.id, city: ctx.message.text });
    }
    console.log(databaseByCity);
    ctx.reply(setAnswer(index));
  }
  cityRequested.delete(ctx.message.chat.id);
});

setInterval(mailing, 60000);

bot.launch();
