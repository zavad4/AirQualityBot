'use strict';
require('dotenv').config();
const BOT_TOKEN = process.env.BOT_TOKEN;
const API_TOKEN = process.env.API_TOKEN;
const API_URL = process.env.API_URL;
const CORRECT_HOUR = 18;
const CORRECT_MINUTES = 16;

module.exports = {
  BOT_TOKEN,
  API_TOKEN,
  API_URL,
  CORRECT_HOUR,
  CORRECT_MINUTES,
};
