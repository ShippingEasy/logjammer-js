function defaultData() {
  return {};
}

const LogJammer = {
  Severity: {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
    FATAL: 4,
    UNKNOWN: 5
  }
};

Object.freeze(LogJammer.Severity);

LogJammer.severityOf = (severityStr) => {
  return severityStr ? LogJammer.Severity[severityStr.toUpperCase()] : null;
};

LogJammer.config = {
  application: '',
  logLevel: process.env.LOG_LEVEL ? LogJammer.severityOf(process.env.LOG_LEVEL) : LogJammer.Severity.INFO,
  origin: {},
  globalData: {},
  pretty: false,
  device: console,
  publisher: {
    publish: (logEvent, pretty=false) => {
      var json;

      if (pretty) {
        json = JSON.stringify(logEvent, null, 2);
      } else {
        json = JSON.stringify(logEvent);
      }

      LogJammer.config.device.log(json);
    }
  }
};

LogJammer.logger = (name) => {
  var thisLogger = {
    name: name || LogJammer.config.name,
    logLevel: LogJammer.config.logLevel,
    origin: LogJammer.config.origin,
    globalData: LogJammer.config.globalData,
    pretty: LogJammer.config.pretty,
    publisher: LogJammer.config.publisher,
    __buildEvent: (severity, message, data, err) => {
      if (!LogJammer.config.application) {
        throw "LogJammer.config.application must be set!";
      }

      var logEvent = {
        severity: severity,
        logger: thisLogger.name,
        message: message,
        origin: LogJammer.config.origin
      };

      if (err) {
        var backtrace = err.stack.split('\n');
        backtrace.shift();

        logEvent.error = {
          type: err.name,
          code: err.code,
          details: err.message,
          backtrace: backtrace
        };
      }

      data = data ? data : defaultData;

      logEvent[LogJammer.config.application] = Object.assign(data(), LogJammer.config.globalData);

      return logEvent;
    }
  };

  thisLogger.debug = (msg, data=defaultData, err) => {
    if (thisLogger.logLevel <= LogJammer.Severity.DEBUG) {
      var logEvent = thisLogger.__buildEvent('debug', msg, data, err);

      thisLogger.publisher.publish(logEvent, thisLogger.pretty);
    }
  };

  thisLogger.info = (msg, data=defaultData, err) => {
    if (thisLogger.logLevel <= LogJammer.Severity.INFO) {
      var logEvent = thisLogger.__buildEvent('info', msg, data, err);

      thisLogger.publisher.publish(logEvent, thisLogger.pretty);
    }
  };

  thisLogger.warn = (msg, data=defaultData, err) => {
    if (thisLogger.logLevel <= LogJammer.Severity.WARN) {
      var logEvent = thisLogger.__buildEvent('warn', msg, data, err);

      thisLogger.publisher.publish(logEvent, thisLogger.pretty);
    }
  };

  thisLogger.error = (msg, data=defaultData, err) => {
    if (thisLogger.logLevel <= LogJammer.Severity.ERROR) {
      var logEvent = thisLogger.__buildEvent('error', msg, data, err);

      thisLogger.publisher.publish(logEvent, thisLogger.pretty);
    }
  };

  thisLogger.fatal = (msg, data=defaultData, err) => {
    if (thisLogger.logLevel <= LogJammer.Severity.FATAL) {
      var logEvent = thisLogger.__buildEvent('fatal', msg, data, err);

      thisLogger.publisher.publish(logEvent, thisLogger.pretty);
    }
  };

  thisLogger.unknown = (msg, data=defaultData, err) => {
    if (thisLogger.logLevel <= LogJammer.Severity.UNKNOWN) {
      var logEvent = thisLogger.__buildEvent('unknown', msg, data, err);

      thisLogger.publisher.publish(logEvent, thisLogger.pretty);
    }
  };


  thisLogger.origin.application = LogJammer.config.application;

  return thisLogger;
};

module.exports = LogJammer;
