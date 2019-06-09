/**
 * @file LutraBot application logic
 * @author Patrick Godschalk
 * @copyright Patrick Godschalk 2017-2019
 * @license MIT
 */

const config = require('../config/config.json');

const request = require('request');

const RelayHandler = require('./RelayHandler');
const Mixer = require('./Mixer');
const MixerEventHandler = require('./MixerEventHandler');
const Twitch = require('./Twitch');
const TwitchEventHandler = require('./TwitchEventHandler');

const MixerBot = new Mixer({
  'username': config.mixer.username,
  'oauth': config.mixer.oauth
});

const TwitchBot = new Twitch({
  'username': config.twitch.username,
  'oauth': config.twitch.oauth,
  'channels': config.twitch.channels
});

// Mixer
// Chat event
MixerBot.on('ChatMessage', data => {
  let message = MixerEventHandler.parseChatMessage(data, TwitchBot.getCoopState());

  for (let i = 0; i < config.mixer.relayTo.length; i++) {
    let destination = config.mixer.relayTo[i];
    message = RelayHandler.relayMessage(message, 'mixer');

    if (destination == 'twitch') {
      TwitchBot.say(config.twitch.streamer, message);

      if (TwitchBot.getCoopState() == true) {
        TwitchBot.say(config.twitch.channels[1], message);
      }
    }
  }
});

// Mixer
// Skill event
MixerBot.on('SkillAttribution', data => {
  let message = MixerEventHandler.parseSkillAttribution(data);

  for (let i = 0; i < config.mixer.relayTo.length; i++) {
    let destination = config.mixer.relayTo[i];

    if (destination == 'twitch') {
      TwitchBot.say(config.twitch.streamer, message);

      if (TwitchBot.getCoopState() == true) {
        TwitchBot.say(config.twitch.channels[1], message);
      }
    }
  }
});

// Mixer
// GIF event
MixerBot.on('GifAttribution', data => {
  request(`https://mixer.com/api/v1/users/${data.triggeringUserId}`, { json: true }, (err, res, body) => {
    if(err) return console.error(err);
    let username = body.username;
    let message = MixerEventHandler.parseGifAttribution(data, username);

    for (let i = 0; i < config.mixer.relayTo.length; i++) {
      let destination = config.mixer.relayTo[i];

      if (destination == 'twitch') {
        TwitchBot.say(config.twitch.streamer, message);

        if (TwitchBot.getCoopState() == true) {
          TwitchBot.say(config.twitch.channels[1], message);
        }
      }
    }
  });
});

// Mixer
// PollStart event
MixerBot.on('PollStart', data => {
  let message = MixerEventHandler.parsePollStart(data);

  for (let i = 0; i < config.mixer.relayTo.length; i++) {
    let destination = config.mixer.relayTo[i];

    if (destination == 'twitch') {
      TwitchBot.say(config.twitch.streamer, message);

      if (TwitchBot.getCoopState() == true) {
        TwitchBot.say(config.twitch.channels[1], message);
      }
    }
  }
});

// Mixer
// PollEnd event
MixerBot.on('PollEnd', data => {
  let message = MixerEventHandler.parsePollEnd(data);

  for (let i = 0; i < config.mixer.relayTo.length; i++) {
    let destination = config.mixer.relayTo[i];

    if (destination == 'twitch') {
      TwitchBot.say(config.twitch.streamer, message);

      if (TwitchBot.getCoopState() == true) {
        TwitchBot.say(config.twitch.channels[1], message);
      }
    }
  }
});

// Twitch
// Action event
TwitchBot.on('ActionMessage', data => {
  let message = TwitchEventHandler.parseActionMessage(data, TwitchBot.getCoopState());

  for (let i = 0; i < config.twitch.relayTo.length; i++) {
    let destination = config.twitch.relayTo[i];
    message = RelayHandler.relayMessage(message, 'twitch');

    if (destination == 'mixer') {
      if (TwitchBot.getCoopState() == false && data.channel != '#' + config.twitch.streamer) {
        return;
      } else {
        MixerBot.say(message);
      }
    }
  }

  if (TwitchBot.getCoopState() == true) {
    for (let i = 0; i < config.twitch.channels.length; i++) {
      if (data.channel != config.twitch.channels[i]) {
        TwitchBot.say(config.twitch.channels[i], message);
      }
    }
  }
});

// Twitch
// Chat event
TwitchBot.on('ChatMessage', data => {
  let message = TwitchEventHandler.parseChatMessage(data, TwitchBot.getCoopState());

  for (let i = 0; i < config.twitch.relayTo.length; i++) {
    let destination = config.twitch.relayTo[i];
    message = RelayHandler.relayMessage(message, 'twitch');

    if (destination == 'mixer') {
      if (TwitchBot.getCoopState() == false && data.channel != '#' + config.twitch.streamer) {
        return;
      } else {
        MixerBot.say(message);
      }
    }
  }

  if (TwitchBot.getCoopState() == true) {
    for (let i = 0; i < config.twitch.channels.length; i++) {
      if (data.channel != config.twitch.channels[i]) {
        TwitchBot.say(config.twitch.channels[i], message);
      }
    }
  }
});

// Twitch
// Coop pseudo-event
TwitchBot.on('CoopRequest', data => {
  if (data.message == '!startcoop') {
    TwitchBot._join();
    TwitchBot.say(config.twitch.channels[0], 'TwitchUnity Coop chat linked with https://twitch.tv/' + config.twitch.channels[1].split('#').join('') + ' lordafSun');
    TwitchBot.say(config.twitch.channels[1], 'lordafSun Coop chat linked with https://twitch.tv/' + config.twitch.channels[0].split('#').join('') + ' TwitchUnity');
    MixerBot.say(':mixerlove Coop chat linked with https://twitch.tv/' + config.twitch.channels[1].split('#').join(''));
  } else if (data.message == '!endcoop') {
    TwitchBot._part();
    TwitchBot.say(config.twitch.channels[0], 'TwitchUnity Coop chat ended with https://twitch.tv/' + config.twitch.channels[1].split('#').join('') + ' lordafSun');
    TwitchBot.say(config.twitch.channels[1], 'lordafSun Coop chat ended with https://twitch.tv/' + config.twitch.channels[0].split('#').join('') + ' TwitchUnity');
    MixerBot.say(':mixerlove Coop chat ended with https://twitch.tv/' + config.twitch.channels[1].split('#').join(''));
  }
});
