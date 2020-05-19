'use strict';
const { Telegraf } = require('telegraf');
const Extra = require('telegraf/extra');
const request = require('request');
const bot = new Telegraf('1241797755:AAGIIpoXru5SWv4mDO5PhSD7N4G3x91mEBQ');

const token = 'aa36752d4a3159859afd0e84b3abf7cacab10018';


async function getQualityByCoords(lon, lat) {
    let res = 0;
    const options = {
        method: 'GET',
        //url: `http://api.waqi.info/feed/${city}/?token=${token}`,
        url: `https://api.waqi.info/feed/geo:${lat};${lon}/?token=${token}`
    };
    request(options, (error, response, body) => {
        if (error) throw new Error(error);
        res = JSON.parse(body).data.aqi;
    });
    console.log('it is res2 ' + res);
    return res;
}

const getQualityByCity = city => {
    let res = 0;
    const options = {
        method: 'GET',
        url: `http://api.waqi.info/feed/${city}/?token=${token}`,
    };
    request(options, (error, response, body) => {
        if (error) throw new Error(error);
        res = JSON.parse(body).data.aqi;
    });
    return res;
};

const arr = new Set();

bot.command('start', ctx => ctx.reply('Please location or city', Extra.markup(markup => markup.resize()
    .keyboard([
        markup.locationRequestButton('Send location'),
        markup.button('Send city')
    ])
    .oneTime()
)));

bot.on('location', ctx => {
    const lon = ctx.message.location.longitude;
    const lat = ctx.message.location.latitude;
    const index = getQualityByCoords(lon, lat);
    console.log('it is index' + index);
    ctx.reply(`Okey, I'll send you air quality index of this place every day. Now it is ${index}`);
});

bot.hears('Send city', ctx => {
    arr.add(ctx.message.from.id);
    ctx.reply('Okey, send me your city');
    console.log(arr);
});

bot.on('text', ctx => {
    if (arr.has(ctx.message.from.id)) {
        const index = getQualityByCity(ctx.message.text);
        ctx.reply(`Okey, I'll send you air quality index of this place every day. Now it is ${index}`);
    }
    arr.delete(ctx.message.from.id);
    console.log(arr);
});

bot.launch();



const a = getQualityByCoords(50.27, 30.30);
//console.log('it is a ' + a);
//getQualityByCity('Lviv');
