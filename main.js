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
                res = 'impossible to determine.';
                reject(error);
            }
            resolve(JSON.parse(body));
        });
    })
        .then(data => {
            console.log(data.data.aqi);
            res = data.data.aqi;
        });
    return res;
}

const databaseByCity = new Set();
const databaseByCoords = new Set();
const cityRequested = new Set();
const CORRECT_HOUR = 13;
const CORRECT_MINUTES = 55;
let currentHour = 0;
let currentMinute = 0;

bot.command('start', ctx => ctx.reply('Please location or city', Extra.markup(markup => markup.resize()
    .keyboard([
        markup.locationRequestButton('Send location'),
        markup.button('Send city'),
    ])
    .oneTime()
)));

bot.hears('Ok', ctx => console.log(databaseByCity, databaseByCoords));

bot.on('location', async ctx => {
    const lon = ctx.message.location.longitude;
    const lat = ctx.message.location.latitude;
    databaseByCoords.add({ id: ctx.message.chat.id, lon, lat });
    console.log(databaseByCoords);
    const index = await getQualityBy('coords', lon, lat);
    ctx.reply(`Okey, I'll send you air quality index of this place every day. Now it is ${index}`);
});

bot.hears('Send city', ctx => {
    cityRequested.add(ctx.message.chat.id);
    ctx.reply('Okey, send me your city');
});

bot.on('text', async ctx => {
    if (cityRequested.has(ctx.message.from.id)) {
        databaseByCity.add({ id: ctx.message.from.id, city: ctx.message.text });
        console.log(databaseByCity);
        const index = await getQualityBy('city', ctx.message.text);
        ctx.reply(`Okey, I'll send you air quality index of this place every day. Now it is ${index}`);
    }
    cityRequested.delete(ctx.message.chat.id);
});

setInterval(() => {
    console.log(new Date().getUTCHours() + ':' + new Date().getUTCMinutes());
    currentHour = new Date().getUTCHours();
    currentMinute = new Date().getUTCMinutes();
    if (currentHour === CORRECT_HOUR && currentMinute === CORRECT_MINUTES) {
        databaseByCity.forEach(async user => {
            const index = await getQualityBy('city', user.city);
            bot.telegram.sendMessage(user.id, index);
        });
        databaseByCoords.forEach(async user => {
            const index = await getQualityBy('coords', user.lon, user.lat);
            bot.telegram.sendMessage(user.id, index);
        });
    }
}, 60000);

bot.launch();
