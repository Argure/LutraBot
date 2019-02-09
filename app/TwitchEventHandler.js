/**
 * @file Parses events originating from Twitch into a common formatted string.
 * @author Patrick Godschalk
 * @copyright Patrick Godschalk 2017-2019
 * @license MIT
 */

module.exports = {

  /**
   * Parses an action message from Twitch and returns a simple parsed string.
   *
   * @param {*} data Raw message data from Twitch IRC
   * @param {boolean} coop Coop currently active?
   * @return {string}
   */
  parseActionMessage (data, coop) {
    let completeMessage = '';
    completeMessage += data.userstate['display-name'];
    completeMessage += ' ';
    completeMessage += data.message;

    if (coop) {
      console.log(data);
      completeMessage += ' [' + data.channel.split('#').join('') + '@Twitch]';
    } else {
      completeMessage += ' [T]';
    }

    return completeMessage;
  },

  /**
   * Parses a chat message from Twitch and returns a simple parsed string.
   *
   * @param {*} data Raw message data from Twitch IRC
   * @param {boolean} coop Coop currently active?
   * @return {string}
   */
  parseChatMessage (data, coop) {
    let completeMessage = '';
    completeMessage += data.userstate['display-name'];
    completeMessage += ': ';
    completeMessage += data.message;

    if (coop) {
      console.log(data);
      completeMessage += ' [' + data.channel.split('#').join('') + '@Twitch]';
    } else {
      completeMessage += ' [T]';
    }

    return completeMessage;
  }
};
