'use strict';
const Telegraf = require('telegraf');
const Extra = require('telegraf/extra');
const request = require('request');
const bot = new Telegraf('1241797755:AAGIIpoXru5SWv4mDO5PhSD7N4G3x91mEBQ');
const token = 'aa36752d4a3159859afd0e84b3abf7cacab10018';

async function getQualityBy(type, ...args) {
  let params = '';
  if (type === 'city') params = args[0];
  else if (type === 'coords') params = `geo:${args[1]};${args[0]}`;
  const options = {
    method: 'GET',
    url: `https://api.waqi.info/feed/${params}/?token=${token}`,
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
  bot.telegram.sendMessage(user.id, index);
};

const setAnswer = index => {
  let answer;
  if (typeof index === 'number') {
    answer = `Okey, I'll send you air quality index of this place every day. Now it is ${index}.`;
  } else answer = 'It is impossible to determine. Please, enter city.';
  return answer;
};

const deleteUser = (database, id) => database.forEach(user => {
  if (user.id === id) database.delete(user);
});

const databaseByCity = new Set();
const databaseByCoords = new Set();
const cityRequested = new Set();
const CORRECT_HOUR = 5;
const CORRECT_MINUTES = 0;
let currentHour = 0;
let currentMinute = 0;

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
  deleteUser(databaseByCity, id);
  deleteUser(databaseByCoords, id);
  console.log(databaseByCity);
  console.log(databaseByCoords);
  ctx.reply('By!');
});

bot.on('location', async ctx => {
  const lon = ctx.message.location.longitude;
  const lat = ctx.message.location.latitude;
  databaseByCoords.add({ id: ctx.message.chat.id, lon, lat });
  console.log(databaseByCoords);
  const index = await getQualityBy('coords', lon, lat);
  ctx.reply(setAnswer(index));
});

bot.hears('🏙 Send city', ctx => {
  cityRequested.add(ctx.message.chat.id);
  ctx.reply('Okey, send me your city');
});

bot.on('text', async ctx => {
  if (cityRequested.has(ctx.message.chat.id)) {
    const index = await getQualityBy('city', ctx.message.text);
    databaseByCity.add({ id: ctx.message.chat.id, city: ctx.message.text });
    console.log(databaseByCity);
    ctx.reply(setAnswer(index));
  }
  cityRequested.delete(ctx.message.chat.id);
});

setInterval(() => {
  console.log(new Date().getUTCHours() + ':' + new Date().getUTCMinutes());
  currentHour = new Date().getUTCHours();
  currentMinute = new Date().getUTCMinutes();
  if (currentHour === CORRECT_HOUR && currentMinute === CORRECT_MINUTES) {
    databaseByCity.forEach(sendQualityBy('city'));
    databaseByCoords.forEach(sendQualityBy('coords'));
  }
}, 60000);

bot.launch();
