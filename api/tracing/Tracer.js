const { init } = require('./tracing');

class Tracer {
  static init(serviceName, environment) {
    this.tracer = init(serviceName, environment).tracer;
  }

  static getTracer() {
    return this.tracer;
  }

  static startSpan(name) {
    return this.tracer.startSpan(name);
  }
}

module.exports = { Tracer };
