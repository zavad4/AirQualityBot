# Air Quality Bot 
This [bot](https://t.me/AirIndexBot) is intended to inform users about air polllution index anywhere they want. The user can share his geolocation or send the city he want to know the index of.
# API/Frameworks
* [Telegraf](https://telegraf.js.org/#/)
* [Air quality index API](https://aqicn.org/api/)

# How to use it
If you want to receive updates about air pollution every morning you need to write **/subscribe**. If you want to stop receiving notification it will be enough to write **/unsubscribe**.

# Installation 
1. Clone this repository 
```git clone https://github.com/zavad4/AirQualityBot.git```
2. In file ```config.js``` change variables like: 
```
const BOT_TOKEN = <YOUR_BOT_TOKEN>;
const API_TOKEN = <YOUR_API_TOKEN>;
const API_URL = <YOUR_API_URL>;
You can get API_TOKEN [here](https://aqicn.org/data-platform/token/#/).
```
# Help
Ask questions at [telegram](https://t.me/zavad4) and post issues in [github](https://github.com/zavad4/AirQualityBot/issues)

# License
ISC © [Elizavieta Zavodovska](https://github.com/zavad4)
