/**
 * @file Parses events originating from Mixer into a common formatted string.
 * @author Patrick Godschalk
 * @copyright Patrick Godschalk 2017-2019
 * @license MIT
 */

module.exports = {

  /**
   * Parses a chat message from Mixer and returns a simple parsed string.
   *
   * @param {*} data Raw message data from the Mixer chat API
   * @param {boolean} coop Coop currently active?
   * @return {string}
   */
  parseChatMessage(data, coop) {
    let completeMessage = '';
    completeMessage += data.user_name;

    // Use a colon except for action type messages and stickers
    if (data.message.meta.me || data.message.meta.is_skill) {
      completeMessage += ' ';
    } else {
      completeMessage += ': ';
    }

    // Mixer chat messages are composed of multiple parts in an array that
    // needs to be iterated through
    for (let i = 0; i < data.message.message.length; i++) {
      let type = data.message.message[i].type;
      switch (type) {
      case 'text':
        completeMessage += data.message.message[i].data;
        break;
      case 'emoticon':
        completeMessage += data.message.message[i].text;
        break;
      case 'link':
        completeMessage += data.message.message[i].url;
        break;
      case 'tag':
        completeMessage += data.message.message[i].text;
        break;
      case 'image':
        completeMessage += ' used a sticker on Mixer: ' + data.message.message[i].text + ' (' + data.message.meta.skill.cost + ' ' + data.message.meta.skill.currency + ')';
        break;
      default:
        console.error('Unknown message type');
      }
    }

    if (coop) {
      completeMessage += ' [M / coop]';
    } else {
      completeMessage += ' [M]';
    }

    return completeMessage;
  },

  /**
   * Parses a skill event message from Mixer and returns a simple parsed
   * string. Stickers are not counted as a skill in this context, those are
   * handled as a regular chat message event. GIFs are usually a skill here but
   * are not emitted as a SkillAttribution event but rather as a custom
   * GifAttribution event.
   *
   * @param {*} data Raw message data from the Mixer chat API
   * @return {string}
   */
  parseSkillAttribution(data) {
    let completeMessage = '';
    completeMessage += data.user_name;
    completeMessage += ' used a skill on Mixer: ' + data.skill.skill_name + ' (' + data.skill.cost + ' ' + data.skill.currency + ')';
    return completeMessage;
  },

  /**
   * Parser a skill pseudo-event from Mixer and returns a simple parsed string.
   * This skill does not come from the chatbot socket but from Constellation
   * since the chatbot socket does not include the gif URL.
   *
   * @param {*} data Raw message data from the Mixer Constellation API
   * @return {string}
   */
  parseGifAttribution(data, username) {
    let completeMessage = '';
    completeMessage += username;
    completeMessage += ' sent a GIF on Mixer (' + data.price + ' ' + data.currencyType + ') - ' + data.parameters.giphyUrl;
    return completeMessage;
  }
};
