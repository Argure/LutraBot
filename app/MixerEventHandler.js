/**
 * @file Parses events originating from Mixer into a common formatted string.
 * @author Patrick Godschalk
 * @copyright Patrick Godschalk 2017-2019
 * @license MIT
 */

const helpers = require('./helpers');

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
    completeMessage = 'PurpleStar ';
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
    completeMessage = 'TTours ';
    completeMessage += username;
    completeMessage += ' sent a GIF on Mixer (' + data.price + ' ' + data.currencyType + ') - ' + data.parameters.giphyUrl;
    return completeMessage;
  },

  /**
   * Parses a PolLStart-event from Mixer and returns a simple parsed string.
   * Contains who started the poll, the poll subject, the poll duration in
   * seconds, and the responses.
   *
   * @param {*} data Raw message data from the Mixer chat API
   * @return {string}
   */
  parsePollStart(data) {
    let completeMessage = '';
    completeMessage += 'TwitchVotes ';
    completeMessage += data.author.user_name; // Username
    completeMessage += ' started a poll on Mixer: "';
    completeMessage += data.q; // Title
    completeMessage += '" for ';
    completeMessage += Math.ceil(data.duration / 1000); // Duration in seconds, rounded up;
    completeMessage += ' seconds.\n\nChoices:\n';

    for (let i = 0; i < data.answers.length; i++) {
      completeMessage += '"' + data.answers[i] + '"';

      if (i == data.answers.length - 1) {
        completeMessage += '.';
      } else {
        completeMessage += ', ';
      }
    }

    return completeMessage;
  },

  /**
   * Parses a PollEnd-event from Mixer and returns a simple parsed string.
   * Contains the announcement that the poll has ended and the results.
   *
   * @param {*} data Raw message data from the Mixer chat API
   * @return {string}
   */
  parsePollEnd(data) {
    let completeMessage = '';
    completeMessage += 'TwitchVotes The poll has ended! ';

    let responses = helpers.getHighestValueKeys(data.responses);

    if (responses.length == 1) {
      completeMessage += 'Winner: ';
      completeMessage += '"' + responses[0] + '"';
      completeMessage += ' (';
      completeMessage += helpers.getHighestValue(data.responses);
      completeMessage += ')';
    } else {
      completeMessage += 'Tie: ';
      for (let i = 0; i < responses.length; i++) {
        completeMessage += '"' + responses[i] + '"';

        if (i == responses.length - 1) {
          completeMessage += '.';
        } else {
          completeMessage += ', ';
        }
      }
      completeMessage += ' (';
      completeMessage += helpers.getHighestValue(data.responses);
      completeMessage += ')';
    }

    completeMessage += ' -- ';
    completeMessage += data.voters;
    completeMessage += ' total votes.';

    return completeMessage;
  }
};
