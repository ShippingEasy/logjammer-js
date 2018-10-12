# LogJammer JS
LogJammer is a pluggable structured logging lib for orgs with multiple apps/microservices.

## Basic Usage:
1. Install the package:

```
npm install  logjammer
```

2. Run a `node` repl to test:
```js
const LogJammer = require('logjammer');

LogJammer.config.application = 'my-app';
LogJammer.config.pretty = true;

var log = LogJammer.logger('my-logger');

log.info('This is a test');
```

3. Watch the results
```json
{
  "severity": "info",
  "logger": "my-logger",
  "message": "This is a test",
  "origin": {
    "application": "my-app"
  }
  "my-app": {}
}
```

## Log Levels
You can log using methods for the following severity levels: `debug`, `info`, `warn`, `error`,
`fatal` and `unknown`:

```js
log.debug('debug messasge');
log.info('info messasge');
log.warn('warn messasge');
log.error('error messasge');
log.fatal('fatal messasge');
log.unknown('unknown messasge');
```

You will see the following output:
```json
{
  "severity": "info",
  "logger": "my-logger",
  "message": "info message",
  "origin": {
    "application": "my-app"
  },
  "my-app": {}
}

{
  "severity": "warn",
  "logger": "my-logger",
  "message": "warn message",
  "origin": {
    "application": "my-app"
  },
  "my-app": {}
}

{
  "severity": "error",
  "logger": "my-logger",
  "message": "error message",
  "origin": {
    "application": "my-app"
  },
  "my-app": {}
}

{
  "severity": "fatal",
  "logger": "my-logger",
  "message": "fatal message",
  "origin": {
    "application": "my-app"
  },
  "my-app": {}
}

{
  "severity": "unknown",
  "logger": "my-logger",
  "message": "unknown message",
  "origin": {
    "application": "my-app"
  },
  "my-app": {}
}
```

Note that you did not see a log message for the `debug` method.  Logging severity levels
have a precedence, where `unknown` > `fatal` > `error` > `warn` > `info` > `debug`.  You
can specify the log level below which log messages are squelched with the `LOG_LEVEL`
environment variable. Go ahead and rerun your REPL with a `LOG_LEVEL` of `debug`:

```
LOG_LEVEL=debug node
```

Build your logger instance and rerun your debug logging:
```js
const LogJammer = require('logjammer');

LogJammer.config.application = 'my-app';
LogJammer.config.pretty = true;

var log = LogJammer.logger('my-logger');
log.debug('debug message');
```

Now you see the debug log message:
```json
{
  "severity": "debug",
  "logger": "my-logger",
  "message": "debug message",
  "origin": {
    "application": "my-app"
  },
  "my-app": {}
}
```

## Origin Data
LogJammer's config has an `origin` object where you can put information about
where your log events are coming from.

```js
LogJammer.config.origin.environment = 'production';
LogJammer.config.origin.region = 'us-west-1';
var log = LogJammer.logger('my-logger');
log.info("What is my origin?");
```

The output will be as follows:

```json
{
  "severity": "info",
  "logger": "my-logger",
  "message": "What is my origin?",
  "origin": {
    "application": "my-app",
    "environment": "production",
    "region": "us-west-1"
  },
  "my-app": {}
}
```

## Arbitrary Structured Data
You can decorate your JSON logging with structured data namespaced for your
application to avoid data type collisions between applications when it comes time
for the logs to be aggregated into a single search repository like an ELK
stack.  You can do this at a global and per-log-event scope.

### Globally-Scoped Arbitrary Structured Data
Use the `globalData` object of LogJammer's config to specify any data you want
included with all logged messages.

```js
LogJammer.config.globalData.version = 'v0.1.1';
var log = LogJammer.logger('my-logger');
log.info('We have some...');
log.info('Global data');
```

This results in the following log events being output:

```json
{
  "severity": "info",
  "logger": "my-logger",
  "message": "We have some...",
  "origin": {
    "application": "my-app",
    "environment": "production",
    "region": "us-west-1"
  },
  "my-app": {
    "version": "v0.1.1"
  }
}

{
  "severity": "info",
  "logger": "my-logger",
  "message": "Global data",
  "origin": {
    "application": "my-app",
    "environment": "production",
    "region": "us-west-1"
  },
  "my-app": {
    "version": "v0.1.1"
  }
}
```

### Event-Scoped Arbitrary Structured Data
You can pass a second argument to any of the log methods that is a function
evaluating to an object whose data is included with the log event in the
app-specific namespace:

```js
log.info('We have...', () => ({
  "id": 1
}));
log.info('Event data', () => ({
  "id": 2
}));
```

Which results in the following being output:

```json
{
  "severity": "info",
  "logger": "my-logger",
  "message": "We have some...",
  "origin": {
    "application": "my-app",
    "environment": "production",
    "region": "us-west-1"
  },
  "my-app": {
    "version": "v0.1.1",
    "id": 1
  }
}

{
  "severity": "info",
  "logger": "my-logger",
  "message": "Global data",
  "origin": {
    "application": "my-app",
    "environment": "production",
    "region": "us-west-1"
  },
  "my-app": {
    "version": "v0.1.1",
    "id": 2
  }
}
```

Because you pass in a function to be evaluated for the event-scoped data,
it will only be evaluated if logging is on for the particular level.  This
allows you to log excessively at a `debug` level, but not incur the cost
of collecting the data if your `LOG_LEVEL` is set to `INFO`.

## Error Structured Data
The `warn`, `error` and `fatal` log methods can also accept a third nodejs
`Error` object.  When given to the log method, this results in an `error`
field being populated within the log event.  To see this at work:

```js
try {
  throw new Error('Oops');
} catch (err) {
  log.error('An error occurred', null, err);
}
```

Which results in the following being output:

```json
{
  "severity": "error",
  "logger": "my-logger",
  "message": "An error occurred",
  "origin": {
    "application": "my-app",
    "environment": "production",
    "region": "us-west-1"
  },
  "error": {
    "type": "Error",
    "details": "Ooops",
    "backtrace": [
      "    at repl:2:7",
      "    at ContextifyScript.Script.runInThisContext (vm.js:50:33)",
      "    at REPLServer.defaultEval (repl.js:240:29)",
      "    at bound (domain.js:301:14)",
      "    at REPLServer.runBound [as eval] (domain.js:314:12)",
      "    at REPLServer.onLine (repl.js:468:10)",
      "    at emitOne (events.js:121:20)",
      "    at REPLServer.emit (events.js:211:7)",
      "    at REPLServer.Interface._onLine (readline.js:280:10)",
      "    at REPLServer.Interface._line (readline.js:629:8)"
    ]
  },
  "my-app": {
    "version": "v0.1.1"
  }
}
```

## Because
* A JSON log format is easily indexable into log aggregation platforms, like an ELK stack
* A consistent JSON log format does not require special per-application parsing rules
* The more different apps you have, the more likely they will have collisions in the
  data they want to log. The `id` data from app 1 may be an `Integer` while a `UUID`
  in app 2
* A consistent log format across apps allows your support people to search in the same
  way.  Targetting data from the production `environment` and `us-west-1` region for both
  app 1 and app 2: `origin.environment: production AND origin.region: us-west-1`

The more apps you have, the more important the above becomes.

## Contributing
* Fork
* Fix/Implement
* Submit a PR
