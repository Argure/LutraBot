/**
 * @file Twitch chat interface class
 * @author Patrick Godschalk
 * @copyright Patrick Godschalk 2017-2019
 * @license MIT
 */

const tmi = require('tmi.js');
const assert = require('assert');
const EventEmitter = require('events').EventEmitter;

class Twitch extends EventEmitter {
  constructor({
    username,
    oauth,
    channels
  }) {
    super();

    try {
      assert(username);
      assert(oauth);
      assert(channels);
    } catch(err) {
      throw new Error('missing or invalid arguments');
    }

    this.username = username;
    this.oauth = oauth;
    this.channels = channels;

    this.client = new tmi.client({
      options: {
        debug: false
      },
      identity: {
        username: this.username,
        password: this.oauth
      },
      channels: this.channels
    });

    this.isCoop = false;

    this._connect();
  }

  /**
   * Creates a Twitch chat socket and sets up listeners to various chat events.
   */
  async _connect() {
    this.client.connect();

    this.client.on('action', (channel, userstate, message, self) => {
      // Ignore self
      if(userstate.username == this.username) return;

      let data = {
        channel,
        userstate,
        message,
        self
      };
      this.emit('ActionMessage', data);
    });

    this.client.on('chat', (channel, userstate, message, self) => {
      // Ignore self
      if(userstate.username == this.username) return;

      let data = {
        channel,
        userstate,
        message,
        self
      };

      // CoopRequest start can only be initiated by the bot owner
      if (message.startsWith('!startcoop') && '#' + userstate.username == this.channels[0]) {
        this.emit('CoopRequest', data);
        return;
      }

      // CoopRequest end can be initiated by both channel owners
      if (message.startsWith('!endcoop') && '#' + userstate.username == this.channels[0]) {
        this.emit('CoopRequest', data);
        return;
      } else if (message.startsWith('!endcoop') && '#' + userstate.username == this.channels[1]) {
        this.emit('CoopRequest', data);
        return;
      }

      this.emit('ChatMessage', data);
    });

    this.client.on('clearchat', () => {
      this.emit('ClearChat');
    });
  }

  /**
   * Does not actually JOIN a channel, rather, it only sets a variable. Joining
   * a channel instead of preconfiguring it would be great, but this is
   * unfortunately broken in tmi.js
   */
  async _join() {
    this.isCoop = true;
  }

  /**
   * Does not actually PART a channel, rather, it only sets a variable. Joining
   * a channel instead of preconfiguring it would be great, but this is
   * unfortunately broken in tmi.js
   */
  async _part() {
    this.isCoop = false;
  }

  /**
   * Returns the current coop state.
   *
   * @returns {boolean}
   */
  getCoopState() {
    if (this.isCoop) {
      return true;

    } else {
      return false;
    }
  }

  /**
   * Sends a chat message to Twitch
   *
   * @param {string} channel Channel to send message to
   * @param {string} message Complete message to send to Twitch
   */
  say(channel, message) {
    this.client.say(channel, message).catch((err) => {
      console.error(err);
    });
  }

  /**
   * Clears the chat window
   */
  clear(channel) {
    this.client.clear(channel).catch((err) => {
      console.error(err);
    });
  }
}

module.exports = Twitch;
