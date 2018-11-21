const Discord = require('discord.js');
const ytdl = require('ytdl-core');
const { google } = require('googleapis');
const config = require("./config.json")
const client = new Discord.Client();

var VoiceConnection
var Dispatcher
var MusicQueue = []


function searchListByKeyword(parameters) {
  return new Promise(resolve => {
    var service = google.youtube('v3');
    parameters['key'] = config.YTApiKey;
    service.search.list(parameters, function (err, response) {
      if (err) {
        console.log('The API returned an error: ' + err);
        return;
      }
      resolve(response);
    });
  })
}
client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  client.user.setActivity('Music', { type: "LISTENING" })
});

function connectToChannel(user) {
  return new Promise(resolve => {
    if (user.voiceChannel) {
      user.voiceChannel.join()
        .then(connection => {
          VoiceConnection = connection
          resolve('Successfully connected to the channel!');
        })
        .catch(console.log);
    } else {
      resolve('You need to join a voice channel first!');
    }
  })
}

// Dispatcher.on('end', () => {

// })

client.on('message', async message => {
  if (!message.guild) return;
  if (message.content.split(' ').length != 1) {
    MsgCmd = message.content.match(/^(\S+)\s(.*)/).slice(1);
  }
  if (message.content === '/join') {
    message.reply(await connectToChannel(message.member))
  }
  if (MsgCmd[0] === '/play') {
    if (VoiceConnection == undefined) {
      message.reply(await connectToChannel(message.member))
    }
    var response = await searchListByKeyword({
      'maxResults': '1',
      'part': 'snippet',
      'q': MsgCmd[1]
    })
    message.reply("Playing: " + response.data.items[0].snippet.title)
    Dispatcher = VoiceConnection.playStream(ytdl("https://www.youtube.com/watch?v=" + response.data.items[0].id.videoId, { filter: "audioonly" }));
  }
  if (MsgCmd[0] === '/volume') {
    if (Dispatcher != undefined) {
      Dispatcher.setVolume(MsgCmd[1])
      message.reply("Volume set: " + MsgCmd[1])
    }
  }
  if (MsgCmd[0] === '/status') {
    client.user.setActivity(MsgCmd[1], { type: "LISTENING" })
  }
});
client.login(config.DiscordClientID);