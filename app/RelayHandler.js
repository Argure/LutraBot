/**
 * @file Preprocessing of message strings dependent on both origin and
 *       destination.
 * @author Patrick Godschalk
 * @copyright Patrick Godschalk 2017-2019
 * @license MIT
 */

const config = require('../config/config.json');

const MixerEmoteMap = require('../model/MixerEmoteMap.json');
const TwitchEmoteMap = require('../model/TwitchEmoteMap.json');

module.exports = {

  /**
   * Wrapper function to determine origin of message.
   *
   * @param {string} message Normalized message string
   * @param {string} origin Service message originated from
   */
  relayMessage(message, origin) {
    switch (origin) {
    case 'mixer':
      for (let i = 0; i < config.mixer.relayTo.length; i++) {
        let parsedMessage = this.parseEmote(message, origin, config.mixer.relayTo[i]);
        return parsedMessage;
      }
      break;
    case 'twitch':
      for (let i = 0; i < config.twitch.relayTo.length; i++) {
        let parsedMessage = this.parseEmote(message, origin, config.twitch.relayTo[i]);
        return parsedMessage;
      }
      break;
    default:
      console.error('Unknown message origin');
    }
  },

  /**
   * Parses emotes between origin and destination as defined in the EmoteMap
   * JSON models.
   *
   * @param {string} message Normalized message string
   * @param {string} origin Service message originated from
   * @param {string} destination Service message will be relayed to
   */
  parseEmote(message, origin, destination) {
    switch (origin) {
    case 'mixer':
      for (let i = 0; i < Object.keys(MixerEmoteMap).length; i++) {
        let emote = Object.keys(MixerEmoteMap)[i];

        if (destination == 'twitch') {
          message = message.split(emote).join(MixerEmoteMap[emote].twitch);
        } else {
          console.error('Unknown emote mapping destination');
        }
      }
      return message;
    case 'twitch':
      for (let i = 0; i < Object.keys(TwitchEmoteMap).length; i++) {
        let emote = Object.keys(TwitchEmoteMap)[i];

        if (destination == 'mixer') {
          message = message.split(emote).join(TwitchEmoteMap[emote].mixer);
        } else {
          console.error('Unknown emote mapping destination');
        }
      }
      return message;
    default:
      console.error('Unknown emote mapping origin');
    }
  }
};
