/*
const Hash = require("mix-hash"),
  redis = require("redis"),
  util = require("util");

module.exports = (mongoose, option) => {
  console.log('----------------------------- mongoose cache initialize -----------------------------');

  var exec = mongoose.Query.prototype.exec;
  // var execFind = mongoose.Query.prototype.execFind;
  // const aggregate = mongoose.Model.aggregate;
  var client = redis.createClient(option || "redis://127.0.0.1:6379");
  client.get = util.promisify(client.get);

  mongoose.Query.prototype.cache = function (ttl, customKey) {
    if (typeof ttl === 'string') {
      customKey = ttl;
      ttl = 60;
    }

    this._ttl = ttl;
    this._key = customKey;
    return this;
  }

  mongoose.Query.prototype.exec = async () => {
    console.log('mongoose.Query.prototype.exec ' + this._ttl)

    if (!this._ttl) {
      return exec.apply(this, arguments);
    }
    const key = this._key || Hash.md5(JSON.stringify(Object.assign({}, { name: this.model.collection.name, conditions: this._conditions, fields: this._fields, o: this.options })));
    console.log(key)

    const cached = await client.get(key);
    if (cached) {
      // console.log(`[LOG] Serving from cache`);
      const doc = JSON.parse(cached);
      return Array.isArray(doc) ? doc.map(d => new this.model(d)) : new this.model(doc);
    }

    const result = await exec.apply(this, arguments);
    if (result) {
      client.set(key, JSON.stringify(result), "EX", this._ttl);
    }
    return result;
  }

}
*/

const Hash = require('mix-hash')
const mongoose = require('mongoose');
const util = require('util');
const cache = require('memory-cache');

const exec = mongoose.Query.prototype.exec;

//mongoose.Query.prototype.cache = function (options = { time: 60 }) {
mongoose.Query.prototype.cache = function (time, key) {

  this.useCache = true;
  //  this.time = options.time;
  if (time && typeof time === 'number') this.time = time * 1000;
  //  this.hashKey = JSON.stringify(options.key || this.mongooseCollection.name);
  if (key) this.key = key;

  return this;
};

mongoose.Query.prototype.exec = async function () {

  if (!this.useCache) {
    return await exec.apply(this, arguments);
  }

  const key = (this.key || Hash.md5(JSON.stringify(Object.assign({}, { name: this.model.collection.name, conditions: this._conditions, fields: this._fields, o: this.options }))));
  console.log(`key: ${key}`)
  //console.log(cache.exportJson());
  const cacheValue = cache.get(key);
  //console.log(cacheValue);

  if (cacheValue) {
    return Array.isArray(cacheValue)
      ? cacheValue.map(d => new this.model(d))
      : new this.model(cacheValue);

  }

  const result = await exec.apply(this, arguments);
  //log(this.time);
  cache.put(key, result, this.time)

  console.log("Response from MongoDB stored to cache");
  return result;
};

mongoose.Query.prototype.clearCache = async () => {
  const key = Hash.md5(JSON.stringify(Object.assign({}, { name: this.model.collection.name, conditions: this._conditions, fields: this._fields, o: this.options })));
  cache.del(key);
};