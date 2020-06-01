'use strict';
const request = require('request');
const fs =  require('fs');

const CONSTANTS = require('./config.js');
const { API_TOKEN, API_URL, MAIL_TIME } = CONSTANTS;

async function getQualityBy(type, ...args) {
  let params = '';
  if (type === 'city') params = args[0];
  else if (type === 'coords') params = `geo:${args[1]};${args[0]}`;
  const options = {
    method: 'GET',
    url: API_URL + `${params}/?token=${API_TOKEN}`,
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

const sendQualityBy = (bot, type) => async user => {
  let index = 0;
  if (type === 'city') index = await getQualityBy('city', user.city);
  else if (type === 'coords') {
    index = await getQualityBy('coords', user.lon, user.lat);
  }
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

const replyFile = (ctx, file) => ctx.reply(fs.readFileSync(file, 'utf8'));

const deleteUser = (database, id) => database.filter(user => user.id !== id);

const isInDatabase = (database, id) => {
  let flag = false;
  for (const user of database) {
    if (id === user.id) {
      flag = true;
    }
  }
  return flag;
};

const mailing = (bot, databaseByCity, databaseByCoords) => {
  console.log(new Date().getUTCHours() + ':' + new Date().getUTCMinutes());
  const currentHour = new Date().getUTCHours();
  const currentMinute = new Date().getUTCMinutes();
  if (currentHour === MAIL_TIME.hour && currentMinute === MAIL_TIME.minute) {
    databaseByCity.forEach(sendQualityBy(bot, 'city'));
    databaseByCoords.forEach(sendQualityBy(bot, 'coords'));
  }
};

module.exports = {
  getQualityBy,
  setAnswer,
  replyFile,
  deleteUser,
  isInDatabase,
  mailing,
};
