const mongoose = require('mongoose');

const db_config = {
  mlab: {
    user: 'nobio',
    password: '1gR7hW2cPhtkRlv2',
    uri: 'ds061928.mlab.com:61928/timetrack',
  },
  options: {
    reconnectTries: 1000,
    reconnectInterval: 500,
    poolSize: 5,
    keepAlive: 120,
    bufferMaxEntries: -1,
    useCreateIndex: true,
    useNewUrlParser: true,
  },
};

class Database {
  /**
   * Constructor
   * @param {String} url
   * @param {String} options
   */
  constructor(url, options) {
    this.connect(url, options);
  }

  /**
   * connect data base
   */
  connect(url, options) {
    mongoose.connect(this.url, this.options).then(
      () => {
        console.log('mongodb is ready to use.');
      },
      (err) => {
        console.log(`error while connecting mongodb:${err}`);
      },
    );
  }

  /**
   * close connection to database
   */
  closeConnection() {
    mongoose.connection.close(
      () => {
        console.log('mongodb is closed.');
      },
      (err) => {
        console.log(`error while closing connection mongodb:${err}`);
      },
    );
  }
}
