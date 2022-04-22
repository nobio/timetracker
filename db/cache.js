const Hash = require('mix-hash')
const mongoose = require('mongoose');
const Cache = require('memory-cache');

const exec = mongoose.Query.prototype.exec;

/**
 * prepares to cache values; this method only takes an optional expire time and optional key
 * @param {*} time optional expire time in seconds; default: 60s
 * @param {*} key  optional key to store/read values from cache
 * @returns this
 */
mongoose.Query.prototype.cache = function (time, key) {

  this.useCache = true;
  if (!time || isNaN(time)) this.time = 60 * 1000;  // default: 60 seconds
  if (typeof time === 'number') this.time = time * 1000;
  this.key = (key) ? key : calcHash(this);

  //console.log("...cache: " + this.key)

  return this;
};
mongoose.Query.prototype.exec = async function () {

  // console.log("...exec: " + this.key)
  // if not using the cache (i.e. if not prototype.cache() was called, just use mongoose as usual)
  if (!this.useCache) {
    return await exec.apply(this, arguments);
  }

  // -------------------------- Use cache! ----------------------------

  // 2. try to read value from cache
  const cacheValue = Cache.get(this.key);
  //console.log(cacheValue);

  // 3. if a value has been cached return it (btw: do some magic tricks on Arrays)
  if (cacheValue) {
    //console.log('cached value')
    return Array.isArray(cacheValue)
      ? cacheValue.map(d => new this.model(d))
      : new this.model(cacheValue);

  }

  // 4. ok, value has not been cached yet or has expired. Let's just call mongo db
  const result = await exec.apply(this, arguments);

  // 5. before returning the value, cache it!
  //console.log("this.time: " + this.time)
  Cache.put(this.key, result, this.time)
  //console.log("Response from MongoDB stored to cache");

  // 6. and return it
  return result;
};

/**
 * creates a unique key to store a value in the cache
 * @returns calculated key
 */
function calcHash(THIS) {
  const hash = Hash.md5(
    JSON.stringify(
      Object.assign(
        {},
        {
          name: THIS.model.collection.name,
          conditions: THIS._conditions,
          fields: THIS._fields,
          o: THIS.options,
        }
      )
    )
  );
  return hash;
}