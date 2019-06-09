/**
 * @file Mixer chat interface class
 * @author Patrick Godschalk
 * @copyright Patrick Godschalk 2017-2019
 * @license MIT
 */

const MixerChat = require('@mixer/client-node');
const { Carina } = require('carina');
const ws = require('ws');
const assert = require('assert');
const EventEmitter = require('events').EventEmitter;

Carina.WebSocket = ws;

class Mixer extends EventEmitter {
  constructor({
    username,
    oauth
  }) {
    super();

    try {
      assert(username);
      assert(oauth);
    } catch(err) {
      throw new Error('missing or invalid required arguments');
    }

    this.username = username;
    this.oauth = oauth;

    this.socket = null;
    this.carina = null;
    this.userInfo = null;
    this.carinaUserId = null;

    this.client = new MixerChat.Client();
    // With OAuth we don't need to log in. The OAuth Provider will attach the
    // required information to all of our requests after this call.
    this.client.use(new MixerChat.OAuthProvider(this.client, {
      tokens: {
        access: this.oauth,
        expires: Date.now() + (365 * 24 * 60 * 60 * 1000)
      }
    }));

    this.client.request('GET', `channels/${this.username}?fields=id`).then(response => {
      this.carinaUserId = response.body.id;
    });

    this.client.request('GET', 'users/current').then(response => {
      this.userInfo = response.body;
      return this.client.chat.join(response.body.channel.id);
    }).then(response => {
      const body = response.body;
      return this._connect(this.userInfo.id, this.userInfo.channel.id, body.endpoints, body.authkey);
    }).catch(err => {
      console.error(err);
    });
  }

  /**
   * Creates a Mixer chat socket and sets up listeners to various chat events.
   *
   * @param {number} userId The user to authenticate as
   * @param {number} channelId The channel id to join
   * @param {string[]} endpoints An array of endpoints to connect to
   * @param {string} authkey An authentication key to connect with
   * @returns {Promise.<>}
   */
  async _connect(userId, channelId, endpoints, authkey) {
    // Chat connection
    this.socket = new MixerChat.Socket(ws, endpoints).boot();
    this.carina = new Carina({
      queryString: {
        'Client-ID': this.oauth
      },
      isBot: true
    }).open();

    // Handle errors
    this.socket.on('error', error => {
      console.error('Socket error');
      console.error(error);
    });

    // The PollStart event will keep firing until the poll ends, we only want
    // to relay it once so we simply set and unset this bool on each PollStart
    // and PollEnd.
    let pollActive = false;

    this.socket.on('ChatMessage', data => {
      // Ignore self
      if(data.user_name == this.username) return;

      this.emit('ChatMessage', data);
    });

    this.socket.on('SkillAttribution', data => {
      // Ignore gifs becuase we have our own fake 'GifAttribution' event which
      // uses constellation since this actually includes the GIF url
      if(data.skill.skill_name == 'Send a GIF') return;

      this.emit('SkillAttribution', data);
    });

    this.socket.on('PollStart', data => {
      if (!pollActive) {
        pollActive = true;
        this.emit('PollStart', data);
      }
    });

    this.socket.on('PollEnd', data => {
      pollActive = false;
      this.emit('PollEnd', data);
    });

    this.socket.on('ClearMessages', () => {
      this.emit('ClearMessages');
    });

    this.carina.subscribe(`channel:${this.carinaUserId}:skill`, data => {
      if(data.manifest.name == 'giphy') {
        this.emit('GifAttribution', data);
      }
    });

    return this.socket.auth(channelId, userId, authkey).then(() => {
      console.log('Mixer login successful');
    });
  }

  /**
   * Sends a chat message to Mixer
   *
   * @param {string} msg Complete message to send to Mixer
   */
  say(message) {
    this.socket.call('msg', [message]);
  }

  clear() {
    this.socket.call('clearMessages');
  }
}

module.exports = Mixer;
