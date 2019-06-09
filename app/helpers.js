/**
 * @file LutraBot helper functions
 * @author Patrick Godschalk
 * @copyright Patrick Godschalk 2017-2019
 * @license MIT
 */

module.exports = {
  /**
   * In a JSON object containing one or more keys with an integer value, return
   * the key with the highest integer value. Can return more than one if keys
   * are tied.
   * @param {Object} object
   * @return {Array}
   */
  getHighestValueKeys(object) {
    return Object.keys(object).filter(x => {
      return object[x] == Math.max.apply(null, Object.values(object));
    });
  },

  /**
   * In a JSON object containing one or more keys with an integer value, return
   * the highest integer value. Can return more than one if keys are tied.
   * @param {Object} object
   * @return {Array}
   */
  getHighestValue(object) {
    return Object.values(object).reduce((a, b) => object[a] > object[b] ? a : b);
  }
};
