// vim: filetype=javascript.nodejs.mocha-chai
const expect = require('chai').expect;

describe("LogJammer", () => {
  var LogJammer;

  beforeEach(() => {
    // use un-cached requires of logjammer each run
    delete require.cache[require.resolve('../logjammer.js')];
  });

  describe(".config", () => {
    it("will have an empty application attribute by default", () => {
      LogJammer = require('../logjammer.js');

      expect(LogJammer.config.application).to.equal('');
    });

    it("will deault to a logLevel of info", () => {
      LogJammer = require('../logjammer.js');

      expect(LogJammer.config.logLevel).to.equal(LogJammer.Severity.INFO);
    });

    it("will allow the logLevel to be set by LOG_LEVEL env var", () => {
      process.env.LOG_LEVEL = 'debug';
      LogJammer = require('../logjammer.js');

      expect(LogJammer.config.logLevel).to.equal(LogJammer.Severity.DEBUG);
    });

    it("will have an `origin` attribute that can be populated", () => {
      LogJammer = require('../logjammer.js');
      LogJammer.config.origin.environment = 'test';

      expect(LogJammer.config.origin.environment).to.equal('test');
    });

    it("will have a `globalData` attribute that can be populated", () => {
      LogJammer = require('../logjammer.js');
      LogJammer.config.globalData.version = 'v0.1.0';

      expect(LogJammer.config.globalData.version).to.equal('v0.1.0');
    });

    it("will have a `pretty` attribute that defaults to `false`", () => {
      LogJammer = require('../logjammer.js');

      expect(LogJammer.config.pretty).to.equal(false);
    });

    it("will have a `device` attribute that defaults to the console", () => {
      LogJammer = require('../logjammer.js');
      expect(LogJammer.config.device).to.equal(console);
    });

    it("will have a `publisher` attribute that logs logEvents to the device", () => {
      LogJammer = require('../logjammer.js');

      var logEvent = 'test';
      var publishedLogEvent = null;

      LogJammer.config.device = {
        log: (evt) => {publishedLogEvent = evt}
      };

      LogJammer.config.publisher.publish(logEvent);

      expect(publishedLogEvent).to.equal(`"${logEvent}"`);
    });
  });

  describe(".logger(name)", () => {
    var logEvents;
    var logger;

    beforeEach(() => {
      process.env.LOG_LEVEL = 'debug';
      LogJammer = require('../logjammer.js');
      logEvents = [];

      LogJammer.config.device = {
        log: (msg) => {
          logEvents.push(JSON.parse(msg));
        }
      };

      logger = LogJammer.logger('a-logger');
    });

    it("creates a new logger object with the specified name", () => {
      expect(logger.name).to.equal('a-logger');
    });

    it("creates a new logger object with the configured log level", () => {
      expect(logger.logLevel).to.equal(LogJammer.config.logLevel);
    });

    it("creates a new logger object with the same configured origin", () => {
      expect(logger.origin).to.equal(LogJammer.config.origin);
    });

    it("creates a new logger object with the same configured globalData", () => {
      expect(logger.globalData).to.equal(LogJammer.config.globalData);
    });

    it("creates a new logger object with the same configured pretty attribute", () => {
      expect(logger.pretty).to.equal(LogJammer.config.pretty);
    });

    it("creates a new logger object with the same configured publisher", () => {
      expect(logger.publisher).to.equal(LogJammer.config.publisher);
    });

    ['debug', 'info', 'warn', 'error', 'fatal', 'unknown'].forEach((severity) => {
      describe(`.${severity}`, () => {
        beforeEach(() => {
          LogJammer.config.application = 'logjammer';
          logger.origin.environment = 'test';
          logger.globalData.version = 'v0.1.0';
        });

        it(`publishes a logEvent with a severity attr of '${severity}'`, () => {
          logger[severity](`${severity} message`);

          expect(logEvents[0].severity).to.equal(severity);
        });

        it("publishes a logEvent with a logger attr of the logger name", () => {
          logger[severity](`${severity} message`);

          expect(logEvents[0].logger).to.equal('a-logger');
        });

        it("publishes a logEvent with a message attr set to the passed message", () => {
          logger[severity](`${severity} message`);

          expect(logEvents[0].message).to.equal(`${severity} message`);
        });

        it("publishes log events including origin data", () => {
          logger[severity](`${severity} message`);

          expect(logEvents[0].origin.environment).to.equal(logger.origin.environment);
        });

        it("publishes log events including globally-scoped data", () => {
          logger[severity](`${severity} message`);

          expect(logEvents[0].logjammer.version).to.equal(logger.globalData.version);
        });

        it("publishes log events including event-scoped data", () => {
          logger[severity](`${severity} message`, () => ({id: 1}));

          expect(logEvents[0].logjammer.id).to.equal(1);
        });

        it("publishes log events including information about a passed error", () => {
          var error = new Error('Ooops');

          try {
            throw error;
          } catch (err) {
            logger[severity](`${severity} message`, () => ({id: 1}), err);
          }

          expect(logEvents[0].error.details).to.equal(error.message);
          expect(logEvents[0].error.type).to.equal(error.name);
          expect(logEvents[0].error.backtrace.length).to.equal(error.stack.split('\n').slice(1, 1000).length);
        });

        it("does not publish an event if it is below the logger's logLevel", () => {
          try {
            logger.logLevel = LogJammer.Severity.UNKNOWN + 100;
            logger[severity](`${severity} message`, () => {
              throw 'oops';
            });

            expect(logEvents.length).to.equal(0);
          } finally {
            logger.logLevel = LogJammer.Severity.DEBUG;
          }
        });

        it('allows a null 2nd argument', () => {
          logger[severity](`${severity} message`, null);

          expect(logEvents.length).to.be.greaterThan(0);
        });
      });
    });
  });
});
